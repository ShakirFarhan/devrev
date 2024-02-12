import { createHmac, randomBytes, randomUUID } from 'crypto';
import { prismaClient } from '../lib/db';
import throwCustomError, { ErrorTypes } from '../utils/error-handler';
import {
  CreateUserPayload,
  GitHubUserPayload,
  LoginUserPayload,
} from '../utils/types';
import JWT from 'jsonwebtoken';
import qs from 'qs';
import axios from 'axios';
import { generateUsername, sendMail } from '../utils/helpers';
import { OAuth2Client } from 'google-auth-library';
const JWT_SECRET = process.env.JWT_SECRET as unknown as string;

class UserService {
  public static userByUsername(username: string) {
    return prismaClient.user.findUnique({
      where: {
        username,
      },
    });
  }
  public static userByEmail(email: string) {
    return prismaClient.user.findUnique({
      where: {
        email,
      },
    });
  }
  public static async getUser(userId: string) {
    try {
      const user = await prismaClient.user.findUnique({
        where: {
          id: userId,
        },
      });

      return user;
    } catch (error: any) {
      console.log(error);
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
  // User-Auth Related Code
  private static generateToken(
    payload: { id: string; email: string },
    expiresIn?: string
  ) {
    return JWT.sign(payload, JWT_SECRET, {
      expiresIn,
    });
  }
  private static generateHashPassword(password: string, salt: string) {
    const hashedPassword = createHmac('sha256', salt)
      .update(password)
      .digest('hex');
    return hashedPassword;
  }
  // Auth Using JWT
  public static async createUser(payload: CreateUserPayload) {
    const { email, password, username, firstName, lastName } = payload;

    try {
      if (password.length < 8)
        return throwCustomError(
          'Password should be atleat 8 letters',
          ErrorTypes.BAD_USER_INPUT
        );
      const emailExists = await UserService.userByEmail(email);

      if (emailExists) {
        return throwCustomError(
          'Email Already Exists.',
          ErrorTypes.ALREADY_EXISTS
        );
      }
      const userExits = await UserService.userByUsername(username);

      if (userExits) {
        return throwCustomError(
          'Username already Exists',
          ErrorTypes.ALREADY_EXISTS
        );
      }
      const salt = randomBytes(32).toString('hex');
      const hashedPassword = UserService.generateHashPassword(password, salt);
      let user = await prismaClient.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          salt,
        },
      });

      const payload = {
        id: user.id,
        email: user.email,
      };
      let token = this.generateToken(payload, '1h');
      await sendMail(user.email, token);
      return {
        user: payload,
        message:
          'User registered successfully. Please check your email for confirmation.',
      };
    } catch (error: any) {
      console.log(error);
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
  private static decodeToken(token: string) {
    return JWT.verify(token, JWT_SECRET);
  }
  // User comfirmation using Token sent to Registered User's email.
  public static async confirmEmail(token: string) {
    try {
      const decodeToken: any = UserService.decodeToken(token);
      if (!decodeToken) {
        return throwCustomError('Invalid Token', ErrorTypes.UNAUTHENTICATED);
      }

      const updatedUser = await prismaClient.user.update({
        where: {
          id: decodeToken.id,
        },
        data: {
          verified: true,
        },
      });
      if (!updatedUser)
        return throwCustomError(
          'Invalid Token or User not found.',
          ErrorTypes.NOT_FOUND
        );

      const refreshToken = this.generateToken(
        {
          id: updatedUser.id,
          email: updatedUser.email,
        },
        '10d'
      );
      return {
        token: refreshToken,
        user: updatedUser,
      };
    } catch (error: any) {
      console.log(error);
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
  public static async loginUser(payload: LoginUserPayload) {
    const { email, password } = payload;

    if (password.length < 8)
      return throwCustomError(
        'Password should be atleat 8 letters',
        ErrorTypes.BAD_USER_INPUT
      );

    try {
      const user = await UserService.userByEmail(email);
      if (!user)
        return throwCustomError('User not Found.', ErrorTypes.NOT_FOUND);
      if (!user.verified) {
        const payload = {
          id: user.id,
          email: user.email,
        };
        let token = UserService.generateToken(payload, '1h');
        await sendMail(user.email, token);
        return {
          user: null,
          message: 'Email has been sent. Please Verify!',
        };
      }
      // User registered with Google & Github cannot login manually
      if (user?.provider !== 'local') {
        return throwCustomError(
          `Login using ${user?.provider}`,
          ErrorTypes.BAD_REQUEST
        );
      }
      if (!user)
        return throwCustomError('User Not Found.', ErrorTypes.NOT_FOUND);

      if (!user.salt)
        return throwCustomError('Invalid Password', ErrorTypes.BAD_REQUEST);
      const hashedPassword = UserService.generateHashPassword(
        password,
        user.salt
      );
      if (hashedPassword !== user.password)
        return throwCustomError(
          'Incorrect Password',
          ErrorTypes.BAD_USER_INPUT
        );
      const token = UserService.generateToken(
        {
          id: user.id,
          email: user.email,
        },
        '10d'
      );
      return {
        token,
        user,
      };
    } catch (error: any) {
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
  // Github Auth
  private static async getGithubOAuthToken(code: string) {
    const rootUrl = 'https://github.com/login/oauth/access_token';
    const options = {
      client_id: process.env.GITHUB_CLIENT_ID as unknown as string,
      client_secret: process.env.GITHUB_CLIENT_SECRET as unknown as string,
      code,
    };
    const query = qs.stringify(options);

    try {
      const { data } = await axios.get(`${rootUrl}?${query}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const decoded = qs.parse(data) as { access_token: string };
      return decoded;
    } catch (error: any) {
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }

  private static async getGithubUser(access_token: string) {
    try {
      const { data } = await axios.get(`https:api.github.com/user`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      return data;
    } catch (error: any) {
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
  // Github OAuth/Authentication
  public static async githubOAuth(code: string) {
    if (!code) {
      return throwCustomError(
        'Authorization Code not Provided.',
        ErrorTypes.BAD_USER_INPUT
      );
    }
    try {
      const { access_token } = (await UserService.getGithubOAuthToken(
        code
      )) as {
        access_token: string;
      };
      const { email, avatar_url, login } = (await UserService.getGithubUser(
        access_token
      )) as GitHubUserPayload;

      const user = await prismaClient.user.upsert({
        where: {
          email,
        },
        create: {
          username: login,
          githubUsername: login,
          email,
          verified: true,
          password: randomUUID(),
          provider: 'github',
          profilePhoto: avatar_url,
        },
        update: {
          username: login,
          email,
          profilePhoto: avatar_url,
          provider: 'github',
        },
      });
      if (!user)
        return throwCustomError(
          'Failed to Authecticate',
          ErrorTypes.BAD_REQUEST
        );

      const token = UserService.generateToken(
        { id: user.id, email: user.email },
        '10d'
      );
      return {
        token,
        user,
      };
    } catch (error: any) {
      console.log(error);
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
  // Google OAuth/Authentication
  public static async googleOAuth(id_token: string) {
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const verify: any = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const { name, verified_email, email, picture } = verify.getPayload();
      if (!verified_email)
        return throwCustomError('Email Not Verified', ErrorTypes.BAD_REQUEST);
      const username = generateUsername(name);
      const user = await prismaClient.user.upsert({
        where: { email },
        create: {
          username,
          email,
          profilePhoto: picture,
          password: randomUUID(),
          verified: true,
          provider: 'google',
        },
        update: { username, email, profilePhoto: picture, provider: 'google' },
      });
      if (!user)
        return throwCustomError(
          'Failed to Authecticate',
          ErrorTypes.BAD_REQUEST
        );

      const token = UserService.generateToken(
        { id: user.id, email: user.email },
        '10d'
      );
      return {
        token,
        user,
      };
    } catch (error: any) {
      console.log(error);
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
  // Middleware to Check for user token
  public static async deserializeUser(req: any) {
    if (!req.headers.authorization) return { user: null };

    let token = req.headers.authorization.split(' ')[1];
    if (!token) return { user: null };
    try {
      const decoded: any = UserService.decodeToken(token);

      if (!decoded) return { user: null };

      const user = await prismaClient.user.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (!user)
        return throwCustomError(
          'User with that token no longer exist',
          ErrorTypes.NOT_FOUND
        );
      return {
        user,
      };
    } catch (error: any) {
      console.log('Error in Middleware');
      console.log(error);
      throwCustomError(error.message, ErrorTypes.INTERNAL_SERVER_ERROR);
    }
  }
}
export default UserService;
