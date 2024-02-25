export const queries = `#graphql
    getUserToken(email:String!,password:String!):User
    getUser(userId:String!):UserDetails
    searchUsers(limit:Int!,page:Int!,name:String,skills:[String]):SearchUsersResult
`;
