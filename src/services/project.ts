import {
  ProjectPayload,
  Projects,
  ReplyPayload,
  ReviewPayload,
  User,
} from '../utils/types';
import throwCustomError, {
  ErrorTypes,
  catchErrorHandler,
} from '../utils/error-handler';
import slugify from 'slugify';
import { prismaClient } from '../lib/db';
import { checkProjectExists } from '../utils/helpers';
class ProjectService {
  public static async projects(payload: Projects) {
    const { limit = 10, page, name, tags } = payload;
    let query: any = {};
    if (name) {
      query.name = { contains: name, mode: 'insensitive' };
    }
    if (tags) {
      const lower = tags.map((tag) => tag.toLowerCase());
      query.tags = { hasSome: lower };
    }
    try {
      const projects = await prismaClient.project.findMany({
        where: query,
        take: limit,
        skip: (page - 1) * limit,
        include: {
          owner: true,
        },
      });
      return {
        projects,
        page,
        totalPages: Math.ceil(
          (await prismaClient.project.count(query)) / limit
        ),
      };
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async getProjectReviews(projectId: string) {
    try {
      const reviews = await prismaClient.review.findMany({
        where: {
          projectId,
          replies: {},
        },
        include: {
          replies: {
            where: {
              parentId: null,
            },
            include: {
              user: true,
              children: true,
            },
          },
          user: true,
        },
      });
      if (!reviews)
        return throwCustomError(
          'Invalid Project id.',
          ErrorTypes.BAD_USER_INPUT
        );
      return reviews;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async projectBySlug(ownerId: string, projectSlug: string) {
    try {
      const project = await prismaClient.project.findFirst({
        where: {
          slug: projectSlug,
          ownerId: ownerId,
        },
        include: {
          owner: true,
          reviews: true,
        },
      });
      if (!project)
        return throwCustomError('project not found.', ErrorTypes.NOT_FOUND);
      return project;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async projectById(projectId: string) {
    try {
      const project = prismaClient.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          owner: true,
          reviews: true,
        },
      });
      if (!project)
        return throwCustomError('project not found.', ErrorTypes.NOT_FOUND);
      return project;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async postProject(payload: ProjectPayload, user: User) {
    try {
      const nameTaken = await checkProjectExists(payload.name, user.id);
      if (nameTaken)
        return throwCustomError(
          'Name already Exists',
          ErrorTypes.BAD_USER_INPUT
        );
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

  public static async updateProject(payload: ProjectPayload, user: User) {
    if (payload.projectId) {
      return throwCustomError('Provide Project id', ErrorTypes.BAD_USER_INPUT);
    }
    try {
      const project = await prismaClient.project.findUnique({
        where: {
          id: payload.projectId,
        },
      });
      if (!project)
        return throwCustomError('Project not found.', ErrorTypes.NOT_FOUND);

      if (project.ownerId === user.id || user.role === 'admin') {
        return await prismaClient.project.update({
          where: {
            id: payload.projectId,
          },
          data: {
            ...payload,
          },
        });
      } else {
        return throwCustomError(
          'You are not authorized to update this project.',
          ErrorTypes.FORBIDDEN
        );
      }
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async deleteProject(projectId: string, user: User) {
    if (!projectId) {
      return throwCustomError('Provide Project id', ErrorTypes.BAD_USER_INPUT);
    }

    try {
      let project = await prismaClient.project.findUnique({
        where: {
          id: projectId,
        },
      });
      if (!project) {
        return throwCustomError('Project not found.', ErrorTypes.NOT_FOUND);
      }
      if (project.ownerId === user.id || user.role === 'admin') {
        project = await prismaClient.project.delete({
          where: {
            id: projectId,
          },
          include: {
            owner: true,
          },
        });
        return project;
      } else {
        return throwCustomError(
          'You are not authorized to delete this project.',
          ErrorTypes.FORBIDDEN
        );
      }
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async postReview(review: ReviewPayload, user: User) {
    if (!(review.ratings > 0 && review.ratings <= 5)) {
      return throwCustomError(
        'Rating should be in range 1 to 5',
        ErrorTypes.BAD_USER_INPUT
      );
    }
    try {
      const reviewExists = await prismaClient.review.findFirst({
        where: {
          userId: user.id,
          projectId: review.projectId,
        },
      });
      if (reviewExists) {
        return throwCustomError(
          'Review already Exists.',
          ErrorTypes.ALREADY_EXISTS
        );
      }
      const newReview = await prismaClient.review.create({
        data: {
          userId: user.id,
          projectId: review.projectId,
          message: review.message,
          ratings: review.ratings,
        },
      });
      return newReview;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async deleteReview(reviewId: string, user: User) {
    try {
      const review = await prismaClient.review.findUnique({
        where: {
          id: reviewId,
        },
      });
      if (!review)
        return throwCustomError('Review not Found', ErrorTypes.NOT_FOUND);

      if (user.role !== 'admin' && user.id !== review.userId) {
      }
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async updateReview(review: ReviewPayload, user: User) {
    try {
      const reviewExists = await prismaClient.review.update({
        where: {
          id: review.id,
          userId: user.id,
        },
        data: {
          message: review.message,
          ratings: review.ratings,
        },
      });
      if (!reviewExists)
        return throwCustomError('Review Not found.', ErrorTypes.NOT_FOUND);
      return reviewExists;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async addReply(reply: ReplyPayload, user: User) {
    try {
      const newReply = await prismaClient.reply.create({
        data: {
          message: reply.message,
          reviewId: reply.reviewId,
          parentId: reply.parentId,
          userId: user.id,
        },
        include: {
          review: true,
          parent: true,
        },
      });
      if (!newReply)
        return throwCustomError('Unable to add Reply', ErrorTypes.BAD_REQUEST);

      return newReply;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async updateReply(
    reply: { replyId: string; message: string },
    user: User
  ) {
    try {
      const updatedReply = await prismaClient.reply.update({
        where: {
          id: reply.replyId as string,
          userId: user.id,
        },
        data: {
          message: reply.message,
        },
      });

      if (!updatedReply)
        return throwCustomError('Reply Not found.', ErrorTypes.BAD_USER_INPUT);
      return updatedReply;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async deleteReply(replyId: string, user: User) {
    try {
      let reply = await prismaClient.reply.findUnique({
        where: {
          id: replyId,
        },
      });
      if (!reply)
        return throwCustomError('Reply not found', ErrorTypes.NOT_FOUND);
      if (reply.userId !== user.id && user.role !== 'admin') {
        return throwCustomError('Unauthorized Access', ErrorTypes.FORBIDDEN);
      }
      reply = await prismaClient.reply.delete({
        where: {
          id: replyId,
        },
      });
      return reply;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async projectCodeFromGithub(githubUrl: string, user: User) {}
  public static async likeUnlikeProject() {
    // action - either like or unlike
  }
  public static async likes() {
    // list of user who liked
  }
}

export default ProjectService;
