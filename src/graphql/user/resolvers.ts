import UserService from '../../services/user';
import { CreateUserPayload, searchUserPayload } from '../../utils/types';
import { isUserAuthenticated } from '../../utils/helpers';
import { GraphQLUpload } from 'graphql-upload-minimal';
// import { GraphQLUpload } from 'graphql-upload';
const queries = {
  getUser: async (_: any, payload: { userId: string }) => {
    const res = await UserService.getUser(payload.userId);
    return res;
  },
  searchUsers: async (_: any, payload: searchUserPayload) => {
    return await UserService.searchUsers(payload);
  },
};
const mutations = {
  createUser: async (_: any, payload: CreateUserPayload) => {
    const res = await UserService.createUser(payload);
    return res?.message;
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
  googleOAuth: async (_: any, payload: { token_id: string }) => {
    const res = await UserService.googleOAuth(payload.token_id);
    return res;
  },
  changePassword: async (
    _: any,
    payload: { oldPassword: string; newPassword: string },
    context: any
  ) => {
    return await UserService.changePassword(
      payload.oldPassword,
      payload.newPassword,
      context.user
    );
  },

  uploadFile: async (_: any, payload: any, context: any) => {
    console.log(payload.file);
    return UserService.uploadFile(payload);
  },
};
export const resolvers = { queries, mutations };
