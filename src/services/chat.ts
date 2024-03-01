import { prismaClient } from '../lib/db';
import { ErrorTypes, catchErrorHandler } from '../utils/error-handler';
import { MessagePayload, User } from '../utils/types';
import throwCustomError from '../utils/error-handler';
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
      });
      return chats;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }

  public static async accessChat(userId: string, user: User) {
    try {
      const chat = await prismaClient.chat.findFirst({
        where: {
          type: {
            not: 'group',
          },
          AND: [
            {
              participants: {
                some: { id: userId },
              },
            },
            {
              participants: {
                some: { id: user.id },
              },
            },
          ],
        },
        include: {
          participants: true,
          latestMessage: true,
          messages: true,
        },
      });
      if (!chat) {
        let participants = [user.id, userId];
        const newChat = await prismaClient.chat.create({
          data: {
            participants: {
              connect: participants.map((id) => ({ id })),
            },
            type: 'private',
          },
          include: {
            participants: true,
            latestMessage: true,
            messages: true,
          },
        });
        return newChat;
      } else {
        return chat;
      }
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
  // Messages
  public static async sendMessage(payload: MessagePayload, user: User) {
    try {
      const newMessage = await prismaClient.message.create({
        data: {
          message: payload.message,
          chatId: payload.chatId,
          senderId: user.id,
        },
      });
      if (!newMessage)
        return throwCustomError('Message not Sent.', ErrorTypes.BAD_REQUEST);
      return newMessage;
    } catch (error) {
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
