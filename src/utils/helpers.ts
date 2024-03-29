import nodemailer from 'nodemailer';
import { prismaClient } from '../lib/db';
import * as Config from '../config/index';
export const sendMail = async (email: string, token: string) => {
  try {
    const transport = nodemailer.createTransport({
      port: Number(Config.MAILER_PORT),
      host: Config.MAILER_HOST,
      service: Config.MAILER_SERVICE,
      secure: Boolean(Config.MAILER_SECURE),
      auth: {
        user: Config.GMAIL_USER,
        pass: Config.GMAIL_PASSWORD,
      },
    });
    await transport.sendMail({
      from: Config.GMAIL_USER,
      to: email,
      subject: 'Confirm Your Email Address',
      text: `
      <p>Thank you for registering! Please click the following link to confirm your email:</p>
      <a href="${process.env.CLIENT_URL}/confirm-email?code=${token}">Confirm Email</a>
    `,
    });
  } catch (error) {
    console.log('Error while sending email : ' + error);
  }
};

export function generateUsername(fullName?: string): string {
  if (!fullName) {
    const randomUsername = Math.random().toString(36).substring(7);
    return `${randomUsername}`;
  }

  // Remove spaces from the full name
  const sanitizedFullName = fullName.replace(/\s/g, '');

  // Add 1-2 random digits to the end
  const randomDigits = Math.floor(Math.random() * 90) + 10;

  // Combine the modified name with random digits
  const finalUsername = `${sanitizedFullName}${randomDigits}`;

  return finalUsername;
}

export async function checkProjectExists(projectName: string, userId: string) {
  const project = await prismaClient.project.findFirst({
    where: {
      ownerId: userId,
      name: {
        equals: projectName,
        mode: 'insensitive',
      },
    },
  });
  return project;
}
export const isUserAuthenticated =
  (next: any) => (root: any, args: any, context: any, info: any) => {
    return new Promise((resolve, reject) => {
      if (!context.user || !context.user.id) {
        reject(new Error('Authentication required.'));
        return;
      }

      next(root, args, context, info)
        .then((result: any) => {
          resolve(result);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  };

export function generateNotificationMessage(
  username: string,
  projectname: string,
  type: 'like' | 'reply' | 'review' | 'message'
) {
  let message = '';

  switch (type) {
    case 'like':
      message = `${username} has liked your project ${projectname}.`;
      break;
    case 'reply':
      message = `${username} added a reply in ${projectname}.`;
      break;
    case 'message':
      message = `${username} has sent you a message.".`;
      break;
    case 'review':
      message = `${username} has reviewed your project ${projectname}.`;
      break;
    default:
      message = `You have a new notification regarding your project ${projectname}.`;
      break;
  }

  return message;
}
