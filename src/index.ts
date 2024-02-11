import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import createApolloServer from './graphql';
async function init() {
  const app = express();
  const PORT = process.env.PORT || 8000;
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/graphql', expressMiddleware(await createApolloServer()));
  app.listen(PORT, () => {
    console.log(`Server listening at PORT-${PORT}`);
  });
}
init();
