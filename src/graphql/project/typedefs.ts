export const typeDefs = `#graphql
type Project {
  id:ID,
  name:String,
  description:String,
  tags:[String],
  owner:User,
  link:String,
  demo:String,
  githubLink:String,
  isForSale:Boolean,
  price:Int,
  level:String,
  technologies:[String]
  reviews:[Review]
}
type SearchProjectsResult{
  projects:[Project],
  page:Int,
  totalPages:Int
}
type Review{
  id:ID,
  user:User,
  project:Project,
  message:String,
  ratings:Int,
  replies:[Reply]
}
type Reply{
  id:ID,
  parent:Reply,
  children:[Reply]
  message:String,
  review:Review,
  project:Project
  user: User
}
`;
