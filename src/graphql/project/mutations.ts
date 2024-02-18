export const mutations = `#graphql
postProject(name:String!,description:String!,tags:[String!],link:String!,demo:String,githubLink:String):Project
updateProject(projectId:String!,name:String!,description:String!,tags:[String!],link:String!,demo:String,githubLink:String):Project
deleteProject(projectId:String!):Project
postReview(projectId:String!,ratings:Int!,message:String):Review
`;
