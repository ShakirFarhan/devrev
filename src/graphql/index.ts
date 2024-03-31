import { ApolloServer } from '@apollo/server';
import { User } from './user';
import { Project } from './project';
import { GraphQLUpload } from 'graphql-upload-minimal';
import { Chat } from './chat';
import { Common } from './common';
export default async function createApolloGraphQLServer(app: any) {
  const graphQLServer = new ApolloServer({
    typeDefs: `#graphql
    ${User.typeDefs}
    ${Project.typeDefs}
    ${Chat.typedefs}
    ${Common.typedefs}

    type Query{
      ${User.queries}
      ${Project.queries}
      ${Chat.queries}
      ${Common.queries}

    }
    type Mutation{
     ${User.mutations}
     ${Project.mutations}
     ${Chat.mutations}
     ${Common.mutations}

    }`,
    resolvers: {
      Upload: GraphQLUpload,
      Query: {
        ...User.resolvers.queries,
        ...Project.resolvers.queries,
        ...Chat.resolvers.queries,
        ...Common.resolvers.queries,
      },
      Mutation: {
        ...User.resolvers.mutations,
        ...Project.resolvers.mutations,
        ...Chat.resolvers.mutations,
        ...Common.resolvers.mutations,
      },
    },
    csrfPrevention: false,
    cache: 'bounded',
  });

  await graphQLServer.start();

  return graphQLServer;
}
