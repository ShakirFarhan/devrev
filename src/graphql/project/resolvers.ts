import ProjectService from '../../services/project';
import { isUserAuthenticated } from '../../utils/helpers';
import {
  ProjectPayload,
  Projects,
  ReplyPayload,
  ReviewPayload,
} from '../../utils/types';

const queries = {
  projects: async (_: any, payload: Projects, context: any) => {
    return await ProjectService.projects(payload);
  },
  projectBySlug: async (
    _: any,
    payload: { ownerId: string; projectSlug: string },
    context: any
  ) => {
    return await ProjectService.projectBySlug(
      payload.ownerId,
      payload.projectSlug
    );
  },
  projectById: async (_: any, payload: { projectId: string }, context: any) => {
    return await ProjectService.projectById(payload.projectId);
  },
  projectReviews: isUserAuthenticated(
    async (_: any, payload: { projectId: string }) => {
      return await ProjectService.getProjectReviews(payload.projectId);
    }
  ),
};
const mutations = {
  postProject: isUserAuthenticated(
    async (_: any, payload: ProjectPayload, context: any) => {
      return await ProjectService.postProject(payload, context.user);
    }
  ),
  updateProject: isUserAuthenticated(
    async (_: any, payload: ProjectPayload, context: any) => {
      return await ProjectService.updateProject(payload, context.user);
    }
  ),
  deleteProject: isUserAuthenticated(
    async (_: any, payload: { projectId: string }, context: any) => {
      return await ProjectService.deleteProject(
        payload.projectId,
        context.user
      );
    }
  ),
  postReview: isUserAuthenticated(
    async (_: any, payload: ReviewPayload, context: any) => {
      return await ProjectService.postReview(payload, context.user);
    }
  ),
  deleteReview: isUserAuthenticated(
    async (_: any, payload: { reviewId: string }, context: any) => {
      return await ProjectService.deleteReview(payload.reviewId, context.user);
    }
  ),
  updateReview: isUserAuthenticated(
    async (_: any, payload: ReviewPayload, context: any) => {
      return await ProjectService.updateReview(payload, context.user);
    }
  ),
  addReply: isUserAuthenticated(
    async (_: any, payload: ReplyPayload, context: any) => {
      return await ProjectService.addReply(payload, context.user);
    }
  ),
  updateReply: isUserAuthenticated(
    async (
      _: any,
      payload: { replyId: string; message: string },
      context: any
    ) => {
      return await ProjectService.updateReply(payload, context.user);
    }
  ),

  deleteReply: isUserAuthenticated(
    async (_: any, payload: { replyId: string }, context: any) => {
      return await ProjectService.deleteReply(payload.replyId, context.user);
    }
  ),
};
export const resolvers = { queries, mutations };
