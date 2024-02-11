import { ApolloServer } from '@apollo/server';
import { User } from './user';
import { Project } from './project';

export default async function createApolloServer() {
  const graphQLServer = new ApolloServer({
    typeDefs: `#graphql
    ${User.typeDefs}
    ${Project.typeDefs}
    type Query{
       ${User.queries}
       ${Project.queries}
    }
    type Mutation{
      ${User.mutations}
      ${Project.mutations}
    }
  `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Project.resolvers.queries,
      },
      Mutation: {
        ...User.resolvers.mutations,
        ...Project.resolvers.mutations,
      },
    },
    introspection: true,
  });

  await graphQLServer.start();
  return graphQLServer;
}
