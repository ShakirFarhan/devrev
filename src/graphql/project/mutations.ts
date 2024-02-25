export const mutations = `#graphql
postProject(name:String!,description:String!,tags:[String!],link:String!,demo:String,githubLink:String):Project
updateProject(projectId:String!,name:String!,description:String!,tags:[String!],link:String!,demo:String,githubLink:String):Project
deleteProject(projectId:String!):Project
postReview(projectId:String!,ratings:Int!,message:String):Review
updateReview(reviewId:String!,ratings:Int,message:String):Review
deleteReview(reviewId:String!):Review
addReply(reviewId:String!,parentId:String,message:String!):Reply
updateReply(replyId:String!,message:String!):Reply
deleteReply(replyId:String!):Reply

`;
