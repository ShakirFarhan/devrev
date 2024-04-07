export const mutations = `#graphql
createChat(username:String!):Chat
deleteChat(chatId:String!):Chat
sendMessage(message:String,file:String,chatId:String!,userId:String!):Message
deleteMessage(messageId:String!):Message
`;
