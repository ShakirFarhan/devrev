export const mutations = `#graphql
createChat(username:String!):Chat
deleteChat(chatId:String!):Chat
sendMessage(message:String,file:Upload,chat:String!,sender:UserInput!,createdAt:Date!):Message
deleteMessage(messageId:String!):Message
sendMessageMockup(chatId:String!):Boolean
`;
