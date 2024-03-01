export const typedefs = `#graphql
type Chat{
id:ID!,
type:String!,
name:String,
photo:String,
participants:[User],
messages:[Message],
latestMessage:Message,
admins:[User],
createdAt:String,
updatedAt:String
}
type Message {
  id:ID!,
  message:String,
  file:String,
  sender:User
  chat:Chat
  createdAt:String

}

`;
