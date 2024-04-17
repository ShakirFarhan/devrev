export const mutations = `#graphql
  createUser(email:String!,password:String!,username:String!,firstName:String!,lastName:String!):User
  testing:String
  confirmEmail(token:String!):AuthPayload
  loginUser(email:String!,password:String!):AuthPayload
  googleOAuth(tokenId:String!,tokenType:String!):AuthPayload
  githubOAuth(code:String!):AuthPayload
  changePassword(oldPassword:String!,newPassword:String!):String
  followUser(userId:String!):Boolean
  unfollowUser(userId:String!):Boolean
  updateUser(payload:updateUser,profilePhoto:Upload):User
  updateUsername(username:String!):Boolean

`;
