import ChatService from '../../services/chat';
import { isUserAuthenticated } from '../../utils/helpers';
import { ChatPayload, MessagePayload } from '../../utils/types';

const queries = {
  fetchChats: isUserAuthenticated(
    async (_: any, payload: any, context: any) => {
      return await ChatService.fetchChats(context.user);
    }
  ),
};
const mutations = {
  // Chats
  accessChats: isUserAuthenticated(
    async (_: any, payload: { userId: string }, context: any) => {
      return await ChatService.accessChat(payload.userId, context.user);
    }
  ),
  deleteChat: isUserAuthenticated(
    async (_: any, payload: { chatId: string }, context: any) => {
      return await ChatService.deleteChat(payload.chatId, context.user);
    }
  ),

  // Messages
  sendMessage: isUserAuthenticated(async (_: any, payload: MessagePayload) => {
    return await ChatService.sendMessage(payload);
  }),
  deleteMessage: isUserAuthenticated(
    async (_: any, payload: { messageId: string }, context: any) => {
      return await ChatService.deleteMessage(payload.messageId, context.user);
    }
  ),
};
export const resolvers = { queries, mutations };
