import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import createApolloGraphQLServer from './graphql';
import UserService from './services/user';
async function init() {
  const app = express();
  const PORT = process.env.PORT || 8000;
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    '/graphql',
    expressMiddleware(await createApolloGraphQLServer(), {
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
