import ProjectService from '../../services/project';
import { ProjectPayload, Projects } from '../../utils/types';

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
};
const mutations = {
  postProject: async (_: any, payload: ProjectPayload, context: any) => {
    return await ProjectService.postProject(payload, context.user);
  },
  updateProject: async (_: any, payload: ProjectPayload, context: any) => {
    return await ProjectService.updateProject(payload, context.user);
  },
  deleteProject: async (
    _: any,
    payload: { projectId: string },
    context: any
  ) => {
    return await ProjectService.deleteProject(payload.projectId, context.user);
  },
};
export const resolvers = { queries, mutations };
