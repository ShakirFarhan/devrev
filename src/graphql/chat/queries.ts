export const queries = `#graphql
fetchChats(payload:String):[Chat]
accessChats(username:String!,limit:Int,page:Int!):AccessChat
`;
