export interface CreateUserPayload {
  email: string;
  password: string;
  username: string;
  fullName: string;
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
  githubLink?: string;
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
}