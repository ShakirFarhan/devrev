import { PostProjectPayload, UpdateProjectPayload, User } from '../utils/types';
import throwCustomError, {
  ErrorTypes,
  catchErrorHandler,
} from '../utils/error-handler';
import slugify from 'slugify';
import { prismaClient } from '../lib/db';
class ProjectService {
  public static async postProject(payload: PostProjectPayload, user: User) {
    if (!user || !user.id) {
      throwCustomError(
        'Not Authorized. Login First.',
        ErrorTypes.UNAUTHENTICATED
      );
    }

    try {
      const project = await prismaClient.project.create({
        data: {
          ...payload,
          slug: slugify(payload.name, { lower: true }),
          link: payload.link,
          owner: {
            connect: {
              id: user.id,
            },
          },
        },
        include: {
          owner: true,
        },
      });
      if (!project)
        return throwCustomError(
          'Something went wrong.',
          ErrorTypes.BAD_REQUEST
        );
      return project;
    } catch (error) {
      console.log(error);
      throw catchErrorHandler(error);
    }
  }

  public static async updateProject(
    projectId: string,
    payload: UpdateProjectPayload,
    user: User
  ) {
    if (!user || !user.id) {
      return throwCustomError('Not Authorized.', ErrorTypes.UNAUTHENTICATED);
    }
    if (!projectId) {
      return throwCustomError('Provide Project id', ErrorTypes.BAD_USER_INPUT);
    }
    try {
      const project = await prismaClient.project.findUnique({
        where: {
          id: projectId,
        },
      });
      if (!project)
        return throwCustomError('Project not found.', ErrorTypes.NOT_FOUND);
      if (project.ownerId !== user.id || user.role === 'admin') {
        return throwCustomError(
          'You are not authorized to update this project.',
          ErrorTypes.FORBIDDEN
        );
      }
      return await prismaClient.project.update({
        where: {
          id: projectId,
        },
        data: {
          ...payload,
        },
      });
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
}

export default ProjectService;
