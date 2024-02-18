export const mutations = `#graphql
  createUser(email:String!,password:String!,username:String!,firstName:String!,lastName:String!):String
  testing:String
  confirmEmail(token:String!):AuthPayload
  loginUser(email:String!,password:String!):AuthPayload
  googleOAuth(tokenId:String!):AuthPayload
  githubOAuth(code:String!):AuthPayload
  changePassword(oldPassword:String!,newPassword:String!):String
`;