export const mutations = `#graphql
accessChats(userId:String!):Chat
deleteChat(chatId:String!):Chat
sendMessage(message:String,file:String,chatId:String!):Message
deleteMessage(messageId:String!):Message

`;
