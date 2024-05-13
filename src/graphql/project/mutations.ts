export const mutations = `#graphql
postProject(name:String!,description:String!,tags:[String!],link:String!,demo:String,githubLink:String,overview:String,includes:String):Project
updateProject(projectId:String!,name:String!,description:String!,tags:[String!],link:String!,demo:String,githubLink:String):Project
deleteProject(projectId:String!):Project
likeProject(projectId:String!):Boolean
unlikeProject(projectId:String!):Boolean
postReview(projectId:String!,ratings:Int!,message:String):Review
updateReview(reviewId:String!,ratings:Int,message:String):Review
deleteReview(reviewId:String!):Review
addReply(reviewId:String!,parentId:String,message:String!,projectId:String!):Reply
updateReply(replyId:String!,message:String!):Reply
deleteReply(replyId:String!):Reply
`;
