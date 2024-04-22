import NotificationService from '../../services/notifications';
import UserService from '../../services/user';
import { isUserAuthenticated } from '../../utils/helpers';
import {
  CreateUserPayload,
  UpdateUserPayload,
  searchUserPayload,
} from '../../utils/types';
const queries = {
  getUser: async (_: any, payload: { userId: string }) => {
    const res = await UserService.getUser(payload.userId);
    return res;
  },
  searchUsers: async (_: any, payload: searchUserPayload) => {
    return await UserService.searchUsers(payload);
  },
  userByEmail: async (_: any, payload: { email: string }) => {
    return await UserService.userByEmail(payload.email);
  },
  userByUsername: async (_: any, payload: { username: string }) => {
    return await UserService.userByUsername(payload.username);
  },
  isValidUser: async (_: any, payload: { token: string }) => {
    return await UserService.isValidUser(payload.token);
  },
  getNotifications: async (
    _: any,
    payload: { page: number; limit: number },
    context: any
  ) => {
    return await NotificationService.myNotifications(
      payload.page,
      payload.limit,
      context.user
    );
  },
};
const mutations = {
  createUser: async (_: any, payload: CreateUserPayload) => {
    return await UserService.createUser(payload);
  },
  confirmEmail: async (_: any, payload: { token: string }) => {
    const { token } = payload;
    const res = await UserService.confirmEmail(token);
    return res;
  },
  loginUser: async (_: any, payload: { email: string; password: string }) => {
    const res = await UserService.loginUser(payload);
    return res;
  },
  githubOAuth: async (_: any, payload: { code: string }) => {
    const res = await UserService.githubOAuth(payload.code);
    return res;
  },
  googleOAuth: async (
    _: any,
    payload: { tokenId: string; tokenType: 'code' | 'credential' }
  ) => {
    const res = await UserService.googleOAuth(
      payload.tokenId,
      payload.tokenType
    );
    return res;
  },
  changePassword: isUserAuthenticated(
    async (
      _: any,
      payload: { oldPassword: string; newPassword: string },
      context: any
    ) => {
      return await UserService.changePassword(
        payload.oldPassword,
        payload.newPassword,
        context.user
      );
    }
  ),
  updateUser: isUserAuthenticated(
    async (
      _: any,
      payload: {
        profilePhoto: File;
        payload: UpdateUserPayload;
      },
      context: any
    ) => {
      let newPayload = {
        ...payload.payload,
        profilePhoto: payload.profilePhoto,
      } as unknown as UpdateUserPayload;
      return await UserService.updateUser(newPayload, context.user);
    }
  ),
  updateUsername: isUserAuthenticated(
    async (_: any, payload: any, context: any) => {
      return await UserService.updateUsername(payload, context.user);
    }
  ),
  followUser: isUserAuthenticated(
    async (_: any, payload: { userId: string }, context: any) => {
      return await UserService.followUser(payload.userId, context.user);
    }
  ),
  unfollowUser: isUserAuthenticated(
    async (_: any, payload: { userId: string }, context: any) => {
      return await UserService.unfollowUser(payload.userId, context.user);
    }
  ),
};
export const resolvers = { queries, mutations };
