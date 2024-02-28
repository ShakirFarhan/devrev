import { ApolloServer } from '@apollo/server';
import { User } from './user';
import { Project } from './project';
import { GraphQLUpload, graphqlUploadExpress } from 'graphql-upload-minimal';
import { finished } from 'stream/promises';
import express from 'express';
export default async function createApolloGraphQLServer(app: any) {
  const graphQLServer = new ApolloServer({
    typeDefs: `#graphql
      type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
    ${User.typeDefs}
    ${Project.typeDefs}
    scalar Upload
    type Query{
      ${User.queries}
      ${Project.queries}
      
    }
    type Mutation{
     ${User.mutations}
     ${Project.mutations}
     singleUpload(file: Upload!): File!

     
    }`,
    resolvers: {
      Upload: GraphQLUpload,
      Query: {
        ...User.resolvers.queries,
        ...Project.resolvers.queries,
      },
      Mutation: {
        ...User.resolvers.mutations,
        ...Project.resolvers.mutations,
        singleUpload: async (parent, { file }) => {
          console.log('here');
          const { createReadStream, filename, mimetype, encoding } = await file;

          // Invoking the `createReadStream` will return a Readable Stream.
          // See https://nodejs.org/api/stream.html#stream_readable_streams
          const stream = createReadStream();

          // This is purely for demonstration purposes and will overwrite the
          // local-file-output.txt in the current working directory on EACH upload.
          const out = require('fs').createWriteStream('local-file-output.txt');
          stream.pipe(out);
          await finished(out);

          return { filename, mimetype, encoding };
        },
      },
    },
    // csrfPrevention: true,
    // cache: 'bounded',

    // introspection: true,
  });

  await graphQLServer.start();

  return graphQLServer;
}
