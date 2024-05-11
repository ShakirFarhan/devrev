export const queries = `#graphql
    getUserToken(email:String!,password:String!):User
    getUser(userId:String!):User
    searchUsers(limit:Int!,page:Int!,name:String,skills:[String]):SearchUsersResult
    userByEmail(email:String!):User
    userByUsername(username:String!):User
    isValidUser(token:String!):User
    getNotifications(page:Int!,limit:Int!):[Notification]
`;
