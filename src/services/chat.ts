import { prismaClient } from '../lib/db';
import { ErrorTypes, catchErrorHandler } from '../utils/error-handler';
import { MessagePayload, User } from '../utils/types';
import throwCustomError from '../utils/error-handler';
import NotificationService from './notifications';
import UserService from './user';
import { uploadFileToS3 } from './s3';
import { generateRandomFilename } from '../utils/helpers';

class ChatService {
  // Chats
  public static async fetchChats(user: User) {
    try {
      const chats = await prismaClient.chat.findMany({
        where: {
          participants: {
            some: { id: { equals: user.id } },
          },
        },
        include: {
          latestMessage: true,
          participants: true,
          admins: true,
        },
      });
      return chats;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  private static async usersChat(senderId: string, recipientId: string) {
    const chat = await prismaClient.chat.findFirst({
      where: {
        type: {
          not: 'group',
        },
        AND: [
          {
            participants: {
              some: { id: senderId },
            },
          },
          {
            participants: {
              some: { id: recipientId },
            },
          },
        ],
      },
      include: {
        participants: true,
        // latestMessage: {
        //   include: {
        //     sender: true,
        //   },
        // },
      },
    });
    return chat;
  }
  public static async createChat(username: string, user: User) {
    const recipient = await UserService.userByUsername(username);
    if (!recipient)
      return throwCustomError('User not Found', ErrorTypes.NOT_FOUND);
    if (recipient.id === user.id)
      return throwCustomError('Provide recipient Id', ErrorTypes.BAD_REQUEST);

    const chat = await ChatService.usersChat(recipient.id, user.id);
    if (chat)
      return throwCustomError('Chat Already Exists', ErrorTypes.ALREADY_EXISTS);
    let participants = [user.id, recipient.id];
    const newChat = await prismaClient.chat.create({
      data: {
        participants: {
          connect: participants.map((id) => ({ id })),
        },
        type: 'private',
      },
    });
    return newChat;
  }
  public static async accessChat(
    username: string,
    user: User,
    limit: number = 10,
    page: number
  ) {
    try {
      // Checking if the recipient exists or is not same as sender
      const recipient = await UserService.userByUsername(username);
      if (!recipient)
        return throwCustomError('User not Found', ErrorTypes.NOT_FOUND);
      if (recipient.id === user.id)
        return throwCustomError('Provide recipient Id', ErrorTypes.BAD_REQUEST);

      const chat = await ChatService.usersChat(recipient.id, user.id);
      if (!chat)
        return throwCustomError('Chat Not Found', ErrorTypes.NOT_FOUND);
      const messages = await prismaClient.message.findMany({
        where: {
          chatId: chat.id,
        },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          sender: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return {
        chat,
        messages,
        totalPages: Math.ceil(
          (await prismaClient.message.count({ where: { chatId: chat.id } })) /
            limit
        ),
        page,
      };
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }

  public static async deleteChat(chatId: string, user: User) {
    try {
      const chat = await prismaClient.chat.delete({
        where: {
          id: chatId,
          AND: [
            {
              type: { not: 'group' },
            },
            {
              type: { not: 'channel' },
            },
          ],
          participants: {
            some: {
              id: user.id,
            },
          },
        },
      });
      if (!chat)
        return throwCustomError(
          'Unable to Delete Chat',
          ErrorTypes.BAD_REQUEST
        );
      return chat;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static blockUnblockChat() {}
  public static sendMessageMockup(chatId: string, user: User) {
    if (chatId && user) {
      return true;
    } else {
      return false;
    }
  }
  // Messages
  public static async sendMessage(payload: MessagePayload) {
    let fileUrl;

    if (payload.file) {
      const filename = generateRandomFilename((await payload.file).filename);
      fileUrl = await uploadFileToS3(
        payload.file,
        `chats/${Date.now().toString()}/${filename}`
      );
    }
    try {
      const newMessage = await prismaClient.message.create({
        data: {
          message: payload.message,
          chatId: payload.chat,
          senderId: payload.sender.id,
          file: fileUrl,
          createdAt: new Date(payload.createdAt),
        },
        include: {
          sender: true,
          chat: {
            select: {
              participants: true,
              type: true,
            },
          },
        },
      });
      const recipient =
        newMessage.chat.type === 'private'
          ? newMessage.chat.participants.find(
              (participant) => participant.id !== payload.sender.id
            )
          : null;
      if (!recipient) return;
      const not = await NotificationService.sendNotification({
        senderId: payload.sender.id,
        recipientId: recipient.id,
        type: 'message',
        content: `Sent you a Message`,
        redirectUri: `/messages/${payload.sender.username}`,
      });
      console.log(not);
      if (!newMessage)
        return throwCustomError('Message not Sent.', ErrorTypes.BAD_REQUEST);

      await prismaClient.chat.update({
        where: {
          id: payload.chat,
        },
        data: {
          latestMessageId: newMessage.id,
        },
      });
      return newMessage;
    } catch (error) {
      console.log(error);
      throw catchErrorHandler(error);
    }
  }
  public static async deleteMessage(messageId: string, user: User) {
    try {
      const message = await prismaClient.message.findUnique({
        where: {
          id: messageId,
          senderId: user.id,
        },
      });
      if (!message)
        return throwCustomError('Message Not found.', ErrorTypes.NOT_FOUND);
      return message;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
}

export default ChatService;
