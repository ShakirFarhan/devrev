export const queries = `#graphql
 projects(limit:Int!,page:Int!,name:String,tags:[String]):SearchProjectsResult
 projectBySlug(projectSlug:String!,ownerId:String!):Project
 projectById(projectId:String!):Project
 projectReviews(projectId:String!):[Review]
 projectLikes(projectId:String!):[Like]
`;
