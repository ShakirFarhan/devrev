export const typeDefs = `#graphql

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
  review:Review
}
`;
