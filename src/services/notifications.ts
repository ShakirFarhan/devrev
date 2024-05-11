import { Server } from 'socket.io';
import { prismaClient } from '../lib/db';
import throwCustomError, {
  ErrorTypes,
  catchErrorHandler,
} from '../utils/error-handler';
import {
  EmitNotificationPayload,
  Notification,
  NotificationPayload,
  User,
} from '../utils/types';
import SocketService from './socket';
import { generateNotificationMessage } from '../utils/helpers';
class NotificationService {
  private static socketService = new SocketService();
  public static async sendNotification(payload: NotificationPayload) {
    try {
      const notification = await prismaClient.notification.create({
        data: {
          ...payload,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              profilePhoto: true,
            },
          },
          recipient: {
            select: {
              id: true,
              fullName: true,
              profilePhoto: true,
            },
          },
        },
      });
      if (!notification)
        return throwCustomError(
          'Failed to Send Notification',
          ErrorTypes.BAD_REQUEST
        );

      await this.socketService.emitNotification(
        notification as EmitNotificationPayload
      );
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async handleNotifications(
    recipients: string[],
    currUser: User,
    type: 'like' | 'reply' | 'message' | 'review',
    projectName: string,
    redirectUri: string
  ) {
    const message = generateNotificationMessage(
      currUser.username,
      projectName,
      type
    );
    recipients.map(async (recipient) => {
      let notification: NotificationPayload = {
        recipientId: recipient as string,
        senderId: currUser.id,
        content: message,
        type: type,
        redirectUri,
      };
      if (currUser.id !== notification.recipientId) {
        console.log('Notification Sent.');
        await NotificationService.sendNotification(notification);
      }
    });
  }
  private static async groupeNotifications(notifications: Notification[]) {
    let groupedArray: {
      key: string;
      count: number;
      notification: Notification;
    }[] = [];
    notifications.forEach((notification) => {
      const key = ((notification.sender.id as string) +
        ':' +
        notification.type) as string;
      const notificationIndex = groupedArray.findIndex(
        (val) => val.key === key
      );
      if (notificationIndex === -1) {
        groupedArray.push({ key, notification, count: 1 });
      } else {
        groupedArray[notificationIndex].count++;
      }
    });

    return groupedArray;
  }
  public static async myNotifications(
    page: number = 1,
    limit: number = 10,
    user: User
  ) {
    try {
      const notifications = await prismaClient.notification.findMany({
        where: {
          recipientId: user.id,
        },
        include: {
          sender: true,
          recipient: true,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const groupedNotifications = await this.groupeNotifications(
        notifications as unknown as Notification[]
      );
      // return groupedNotifications;
      return notifications;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async markNotificationToSeen(
    notificationId: string,
    user: User
  ) {
    try {
      const notification = await prismaClient.notification.update({
        where: {
          id: notificationId,
          recipientId: user.id,
        },
        data: {
          status: 'seen',
        },
      });
      if (!notification)
        throwCustomError('Unable to change status', ErrorTypes.BAD_REQUEST);
      return 'Changed To Seen';
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
}
export default NotificationService;
