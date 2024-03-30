export const mutations = `#graphql
  createUser(email:String!,password:String!,username:String!,firstName:String!,lastName:String!):User
  testing:String
  confirmEmail(token:String!):AuthPayload
  loginUser(email:String!,password:String!):AuthPayload
  googleOAuth(tokenId:String!,tokenType:String!):AuthPayload
  githubOAuth(code:String!):AuthPayload
  changePassword(oldPassword:String!,newPassword:String!):String
  uploadFile(file:Upload!):String!
`;
