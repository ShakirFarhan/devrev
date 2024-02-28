import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import createApolloGraphQLServer from './graphql';
import UserService from './services/user';
import * as Config from './config/index';
import { graphqlUploadExpress } from 'graphql-upload-minimal';

import cors from 'cors';
async function init() {
  const app = express();
  const PORT = Config.PORT || 8000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(graphqlUploadExpress());
  app.use(
    cors({
      origin: '*',
    })
  );
  app.use(
    '/graphql',

    expressMiddleware(await createApolloGraphQLServer(app), {
      context: async ({ req }) => {
        return UserService.deserializeUser(req);
      },
    })
  );
  app.listen(PORT, () => {
    console.log(`Server listening at PORT-${PORT}`);
  });
}
init();
