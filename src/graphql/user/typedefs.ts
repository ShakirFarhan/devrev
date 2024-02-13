export const typeDefs = `#graphql
type UserDetails {
  id: ID,
  username: String,
  email: String,
  created_at: Int,
  updated_at: Int
}
scalar JSON
type User {
  id:ID,
  username:String,
  email:String,
  provider:String,
  fullName:String,
  bio:String,
  profilePhoto:String,
  skills:[String],
  location:[Int],
  githubUsername:String,
  status:String,
  role:String,
  lastLogin:String,
  socials:JSON,
  projects: [Project],
  created_at:Int,
  updated_at:Int,
  reviews_given:[Review],
  project_liked:[Like]
}
type Project {
  id:ID,
  name:String,
  description:String,
  tags:[String],
  hostedLink:String,
  demo:String,
  githubLink:String,
  reviews:[Review]

}
type Review{
  id:ID,
  user: User,
  project: Project,
  message:String,
  replies:[Reply]
}
type Reply{
  id:ID,
  parent:Reply,
  children:[Reply],
  message:String,
  review: Review
}
input UserInput {
  id:ID,
  username:String,
  email:String,
  provider:String,
  created_at:Int,
  updated_at:Int,
}
type Like{
  id:String,
  user:User,
  project:Project,
}
type AuthPayload{
  token:String!,
  user:User!
}
type SearchUsersResult{
  users:[User],
  page:Int,
  totalPages:Int
}
`;
