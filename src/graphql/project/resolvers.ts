import ProjectService from '../../services/project';
import { PostProjectPayload } from '../../utils/types';

const queries = {};
const mutations = {
  postProject: (_: any, payload: PostProjectPayload, context: any) => {
    return ProjectService.postProject(payload, context.user);
  },
};
export const resolvers = { queries, mutations };
