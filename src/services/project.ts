import {
  NotificationPayload,
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
import NotificationService from './notifications';
class ProjectService {
  // fetch all projects
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
  // fetch all project details
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
  // Get Project details by slug
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
  // Get Project details by Id
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
  public static async likes(projectId: string, user: User) {
    try {
      const projects = await prismaClient.like.findMany({
        where: {
          projectId,
        },
        include: {
          project: true,
          user: true,
        },
      });
      return projects;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  // Post new Project
  public static async postProject(payload: ProjectPayload, user: User) {
    try {
      const nameTaken = await checkProjectExists(payload.name, user.id);

      if (nameTaken)
        return throwCustomError(
          'Name already Exists',
          ErrorTypes.BAD_USER_INPUT
        );

      let data = {
        ...payload,
        slug: slugify(payload.name, { lower: true }),
        owner: {
          connect: {
            id: user.id,
          },
        },
      };
      if (!payload.isForSale) {
        if (data.price || data.level) {
          return throwCustomError(
            'Provide valid fields',
            ErrorTypes.BAD_USER_INPUT
          );
        }
      } else {
        if (!data.price || !data.level) {
          return throwCustomError(
            'Provide Price, Level',
            ErrorTypes.BAD_USER_INPUT
          );
        }
      }
      const project = await prismaClient.project.create({
        data,
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
  // Update exisiting project
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
  // Delete exisiting project
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
  // Add review to Project
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
        include: {
          project: {
            include: {
              owner: true,
            },
          },
          user: true,
        },
      });

      let notification: NotificationPayload = {
        recipientId: newReview.project.ownerId,
        senderId: user.id,
        content: `${user.username + ' reviewed your Project.'}`,
        type: 'review',
        redirectUri: '',
      };
      if (user.id !== notification.recipientId) {
        await NotificationService.sendNotification(notification);
      }
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
  // Add Reply to exisiting project review/comment
  public static async addReply(reply: ReplyPayload, user: User) {
    try {
      const newReply = await prismaClient.reply.create({
        data: {
          message: reply.message,
          reviewId: reply.reviewId,
          parentId: reply.parentId,
          projectId: reply.projectId,
          userId: user.id,
        },
        include: {
          review: true,
          parent: true,
          project: {
            select: {
              name: true,
              slug: true,
              ownerId: true,
            },
          },
        },
      });
      if (!newReply)
        return throwCustomError('Unable to add Reply', ErrorTypes.BAD_REQUEST);

      let sendTo = [newReply.project.ownerId] as string[];
      if (newReply.parent?.userId) {
        sendTo.push(newReply.parent?.userId);
      }
      await NotificationService.handleNotifications(
        sendTo,
        user,
        'reply',
        newReply.project.name,
        `/project/${newReply.project.slug}`
      );
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

  public static buy(projectId: string, user: User) {
    try {
      // const project
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async projectCodeFromGithub(githubUrl: string, user: User) {}

  public static async likeProject(projectId: string, user: User) {
    try {
      const likeExists = await prismaClient.like.findFirst({
        where: {
          userId: user.id,
          projectId,
        },
      });
      if (likeExists) return false;
      const like = await prismaClient.like.create({
        data: {
          projectId,
          userId: user.id,
        },
        include: {
          project: {
            select: {
              ownerId: true,
              name: true,
              slug: true,
            },
          },
        },
      });
      let sendTo = [like.project.ownerId] as string[];
      await NotificationService.handleNotifications(
        sendTo,
        user,
        'like',
        like.project.name,
        `/project/${like.project.slug}`
      );
      return true;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  public static async unlikeProject(projectId: string, user: User) {
    try {
      const likeExists = await prismaClient.like.findFirst({
        where: {
          userId: user.id,
          projectId,
        },
      });
      if (!likeExists) return false;
      await prismaClient.like.delete({
        where: {
          id: likeExists.id,
        },
      });
      return true;
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
}

export default ProjectService;
