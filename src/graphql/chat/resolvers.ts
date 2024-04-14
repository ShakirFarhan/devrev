import ChatService from '../../services/chat';
import { isUserAuthenticated } from '../../utils/helpers';
import { MessagePayload } from '../../utils/types';

const queries = {
  fetchChats: isUserAuthenticated(
    async (_: any, payload: any, context: any) => {
      return await ChatService.fetchChats(context.user);
    }
  ),
  accessChats: isUserAuthenticated(
    async (
      _: any,
      payload: { username: string; limit: number; page: number },
      context: any
    ) => {
      return await ChatService.accessChat(
        payload.username,
        context.user,
        payload.limit,
        payload.page
      );
    }
  ),
};
const mutations = {
  // Chats
  createChat: isUserAuthenticated(
    async (_: any, payload: { username: string }, context: any) => {
      return await ChatService.createChat(payload.username, context.user);
    }
  ),
  deleteChat: isUserAuthenticated(
    async (_: any, payload: { chatId: string }, context: any) => {
      return await ChatService.deleteChat(payload.chatId, context.user);
    }
  ),

  // Messages
  sendMessage: isUserAuthenticated(
    async (_: any, payload: MessagePayload, context: any) => {
      return await ChatService.sendMessage(payload);
    }
  ),
  deleteMessage: isUserAuthenticated(
    async (_: any, payload: { messageId: string }, context: any) => {
      return await ChatService.deleteMessage(payload.messageId, context.user);
    }
  ),
  sendMessageMockup: isUserAuthenticated(
    async (_: any, payload: { chatId: string }, context: any) => {
      return ChatService.sendMessageMockup(payload.chatId, context.user);
    }
  ),
};
export const resolvers = { queries, mutations };
