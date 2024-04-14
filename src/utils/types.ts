import { ReadStream } from 'fs';

export interface CreateUserPayload {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}
export interface LoginUserPayload {
  email: string;
  password: string;
}
export interface DecodeTokenType {
  iat: number;
  exp: number;
  id: string;
  email: string;
}
export interface GitHubUserPayload {
  login: string;
  avatar_url: string;
  email: string;
  name: string;
}
export interface GoogleUserPayload {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  provider: string;
  created_at: Date;
  updated_at: Date;
}
export interface searchUserPayload {
  limit: number;
  page: number;
  name?: string;
  skills?: string[];
  order: -1 | 1;
}

export interface ProjectPayload {
  projectId?: string;
  name: string;
  description: string;
  tags: string[];
  link: string;
  demo?: string;
  technologies: string[];
  githubLink?: string;
  isForSale?: boolean;
  price?: number;
  level?: 'beginner' | 'advanced' | 'intermediate';
}
export interface Projects {
  limit: number;
  page: number;
  name?: number;
  tags?: string[];
}
export interface ReviewPayload {
  projectId: string;
  ratings: number;
  message?: string;
  id?: string;
}

export interface ReplyPayload {
  id?: string;
  message: string;
  parentId: string;
  reviewId: string;
  projectId: string;
}

export interface MessagePayload {
  message?: string;
  file?: string;
  chat: string;
  sender: User;
  createdAt: string;
}
export interface NotificationPayload {
  senderId?: string;
  recipientId: string;
  type: 'like' | 'reply' | 'message' | 'review';
  content: string;
  status?: 'seen' | 'unseen';
}
export interface EmitNotificationPayload {
  sender: {
    id: string;
    fullName: string;
    profilePhoto: string;
  };
  recipient: {
    id: string;

    fullName: string;
    profilePhoto: string;
  };
  content: string;
  type: 'like' | 'reply' | 'message' | 'review';
}

export interface JWTTokenPayload {
  id: string;
  email: string;
  tokenType?: 'access' | 'verification';
}

export interface JWTTokenDetails {
  id: string;
  email: string;
  tokenType?: 'access' | 'verification';
  iat: number;
  exp: number;
}
export interface FileUpload {
  fieldName: string;
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadStream;
}

export interface SingleUploadPayload {
  file: Promise<FileUpload>;
}
