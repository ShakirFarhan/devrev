import { Server } from 'socket.io';
import { prismaClient } from '../lib/db';
import throwCustomError, {
  ErrorTypes,
  catchErrorHandler,
} from '../utils/error-handler';
import {
  EmitNotificationPayload,
  NotificationPayload,
  User,
} from '../utils/types';
import SocketService from './socket';
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

  public static async myNotifications(user: User) {
    try {
      const notifications = await prismaClient.notification.findMany({
        where: {
          recipientId: user.id,
        },
      });
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
