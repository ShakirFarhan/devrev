import { createHmac, randomBytes, randomUUID } from 'crypto';
import { prismaClient } from '../lib/db';
import throwCustomError, {
  ErrorTypes,
  catchErrorHandler,
} from '../utils/error-handler';
import {
  JWT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '../config/index';
import {
  CreateUserPayload,
  GitHubUserPayload,
  JWTTokenDetails,
  JWTTokenPayload,
  LoginUserPayload,
  User,
  searchUserPayload,
} from '../utils/types';
import JWT from 'jsonwebtoken';
import qs from 'qs';
import axios from 'axios';
import { generateUsername, sendMail } from '../utils/helpers';
import { OAuth2Client } from 'google-auth-library';
import { finished } from 'stream/promises';
const JWTSECRET = JWT_SECRET as unknown as string;

class UserService {
  public static userByUsername(username: string) {
    return prismaClient.user.findUnique({
      where: {
        username,
      },
    });
  }
  public static async userByEmail(email: string) {
    return await prismaClient.user.findUnique({
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
        include: {
          projects: true,
          followers: {
            include: {
              follower: true,
              following: true,
            },
          },
          following: {
            include: {
              follower: true,
              following: true,
            },
          },
        },
      });

      return user;
    } catch (error: any) {
      throw catchErrorHandler(error);
    }
  }
  public static async searchUsers(payload: searchUserPayload) {
    const { limit = 10, page = 1, name, skills } = payload;
    let query: any = {};
    if (name) {
      query.fullName = { contains: name, mode: 'insensitive' };
      query.username = { contains: name, mode: 'insensitive' };
    }
    if (skills) {
      const lowerCase = skills.map((skill) => skill.toLowerCase());
      query.skills = { hasSome: lowerCase };
    }

    try {
      const users = await prismaClient.user.findMany({
        where: {
          ...query,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          projects: true,
        },
      });
      return {
        users,
        page,
        totalPages: Math.ceil((await prismaClient.user.count(query)) / limit),
      };
    } catch (error) {
      throw catchErrorHandler(error);
    }
  }
  // User-Auth Related Code
  private static generateToken(payload: JWTTokenPayload, expiresIn?: string) {
    return JWT.sign(payload, JWTSECRET, {
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
    const { email, password, username, fullName } = payload;

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
          fullName,
        },
      });
      let token = this.generateToken(
        { id: user.id, email: user.email, tokenType: 'verification' },
        '10m'
      );
      await sendMail(user.email, token);
      return {
        email: user.email,
      };
    } catch (error: any) {
      console.log(error);
      throw catchErrorHandler(error);
    }
  }
  private static decodeToken(token: string) {
    try {
      return JWT.verify(token, JWTSECRET);
    } catch (error) {
      console.log(error);
      throwCustomError('JWT Expired', ErrorTypes.BAD_REQUEST);
    }
  }
  public static async isValidUser(token: string) {
    try {
      if (!token) return;
      const payload = UserService.decodeToken(token) as JWTTokenDetails;

      if (payload.tokenType === 'verification') {
        return throwCustomError(
          'Invalid access token.',
          ErrorTypes.BAD_REQUEST
        );
      }
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.id,
        },
        select: {
          email: true,
          provider: true,
          role: true,
          username: true,
        },
      });
      return user;
      return {};
    } catch (error) {
      console.log(error);
      throwCustomError('JWT Expired', ErrorTypes.BAD_REQUEST);
    }
  }
  // User comfirmation using Token sent to Registered User's email.
  public static async confirmEmail(token: string) {
    try {
      const decodeToken: any = UserService.decodeToken(token);

      if (!decodeToken || decodeToken.tokenType !== 'verification') {
        return throwCustomError('Invalid Token', ErrorTypes.BAD_USER_INPUT);
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
      throw catchErrorHandler(error);
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
      const user = await this.userByEmail(email);

      if (!user) {
        return throwCustomError('User not Found.', ErrorTypes.NOT_FOUND);
      }

      // User registered with Google & Github cannot login manually
      if (user?.provider !== 'local') {
        return throwCustomError(
          `Login using ${user?.provider}`,
          ErrorTypes.BAD_REQUEST
        );
      }
      const hashedPassword = UserService.generateHashPassword(
        password,
        user.salt as string
      );
      if (hashedPassword !== user.password)
        return throwCustomError(
          'Incorrect Password',
          ErrorTypes.BAD_USER_INPUT
        );
      if (!user.verified) {
        const payload = {
          id: user.id,
          email: user.email,
        };
        let token = UserService.generateToken(payload, '1d');
        await sendMail(user.email, token);
        return {
          user: {},
          message: 'Email has been sent. Please Verify!',
        };
      }

      if (!user)
        return throwCustomError('User Not Found.', ErrorTypes.NOT_FOUND);

      if (!user.salt)
        return throwCustomError('Invalid Password', ErrorTypes.BAD_REQUEST);

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
      throw catchErrorHandler(error);
    }
  }
  // Github Auth
  private static async getGithubOAuthToken(code: string) {
    const rootUrl = 'https://github.com/login/oauth/access_token';
    const options = {
      client_id: GITHUB_CLIENT_ID as unknown as string,
      client_secret: GITHUB_CLIENT_SECRET as unknown as string,
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
      throw catchErrorHandler(error);
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
      throw catchErrorHandler(error);
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

      const { email, avatar_url, login, name } =
        (await UserService.getGithubUser(access_token)) as GitHubUserPayload;
      const userExists = await prismaClient.user.findFirst({
        where: {
          email,
        },
      });
      let user: typeof userExists;
      if (!userExists) {
        user = await prismaClient.user.create({
          data: {
            username: login.toLowerCase(),
            githubUsername: login,
            email,
            fullName: name,
            verified: true,
            password: randomUUID(),
            provider: 'github',
            profilePhoto: avatar_url,
          },
        });
      } else {
        user = userExists;
      }

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
      throw catchErrorHandler(error);
    }
  }
  // Google OAuth/Authentication
  public static async googleOAuth(
    id_token: string,
    tokenType: 'code' | 'credential'
  ) {
    try {
      let authToken;
      if (tokenType === 'code') {
        const { data } = await axios.post(
          'https://oauth2.googleapis.com/token',
          {
            code: id_token,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: 'http://localhost:3000', // Must match the redirect URI configured in Google Developer Console
            grant_type: 'authorization_code',
          }
        );
        if (!data.id_token)
          return throwCustomError(
            'Something went wrong. Try Again',
            ErrorTypes.BAD_REQUEST
          );
        authToken = data.id_token;
      } else {
        authToken = id_token;
      }
      const client = new OAuth2Client({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      });
      const verify: any = await client.verifyIdToken({
        idToken: authToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const {
        given_name: firstName,
        family_name: lastName,
        email_verified,
        name,
        email,
        picture,
      } = verify.getPayload();
      if (!email_verified)
        return throwCustomError('Email Not Verified', ErrorTypes.BAD_REQUEST);
      const userExists = await prismaClient.user.findUnique({
        where: {
          email,
        },
      });
      let user: typeof userExists;
      if (!userExists) {
        const username = (await generateUsername(name)) as string;
        user = await prismaClient.user.create({
          data: {
            username,
            email,
            fullName: name,
            profilePhoto: picture,
            password: randomUUID(),
            verified: true,
            provider: 'google',
          },
        });
      } else {
        user = userExists;
      }
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
      throw catchErrorHandler(error);
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
      throw catchErrorHandler(error);
    }
  }
  public static async changePassword(
    oldPassword: string,
    newPassword: string,
    user: User
  ) {
    if (!user || !user.id) {
      return throwCustomError(
        'Both user ID and profile ID are required.',
        ErrorTypes.BAD_USER_INPUT
      );
    }
    if (!oldPassword || oldPassword.length < 8) {
      return throwCustomError(
        'Invalid Old Password',
        ErrorTypes.BAD_USER_INPUT
      );
    }
    if (!newPassword || newPassword.length < 8) {
      return throwCustomError(
        'Invalid New Password',
        ErrorTypes.BAD_USER_INPUT
      );
    }
    const userExists = await prismaClient.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!userExists)
      return throwCustomError('User not found.', ErrorTypes.NOT_FOUND);
    let userSalt = userExists.salt as string;
    const oldHasedPassword = this.generateHashPassword(oldPassword, userSalt);
    const hashedPassword = this.generateHashPassword(newPassword, userSalt);
    if (oldHasedPassword !== userExists.password) {
      return throwCustomError('Invalid Password', ErrorTypes.BAD_USER_INPUT);
    }
    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    return 'Password Changed Successfully';
  }
  public static async followUser(userId: string, user: User) {
    try {
      const userExists = await prismaClient.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!userExists)
        return throwCustomError('User not found.', ErrorTypes.NOT_FOUND);
      const existingFollow = await prismaClient.follows.findFirst({
        where: {
          followerId: user.id,
          followingId: userId,
        },
      });
      if (existingFollow)
        return throwCustomError(
          'You already follow this user.',
          ErrorTypes.BAD_REQUEST
        );
      const follow = await prismaClient.follows.create({
        data: {
          followerId: user.id,
          followingId: userId,
        },
      });
      if (!follow) return false;
      return true;
    } catch (error: any) {
      throw catchErrorHandler(error);
    }
  }

  public static async unfollowUser(userId: string, user: User) {
    try {
      const userExists = await prismaClient.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!userExists)
        return throwCustomError('User not found.', ErrorTypes.NOT_FOUND);
      const existingFollow = await prismaClient.follows.findFirst({
        where: {
          followerId: user.id,
          followingId: userId,
        },
      });
      if (!existingFollow)
        return throwCustomError(
          'You dont follow this user.',
          ErrorTypes.BAD_REQUEST
        );
      const follow = await prismaClient.follows.delete({
        where: {
          id: existingFollow.id,
        },
      });
      if (!follow) return false;
      return true;
    } catch (error: any) {
      throw catchErrorHandler(error);
    }
  }
}
export default UserService;
