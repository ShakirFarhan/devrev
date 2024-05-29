import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import createApolloGraphQLServer from './graphql';
import UserService from './services/user';
import * as Config from './config/index';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import SocketService from './services/socket';
import cors from 'cors';
import http from 'http';
import { messageConsumer } from './services/kafka';
async function init() {
  // messageConsumer();
  const socketService = new SocketService();
  const app = express();
  const server = http.createServer(app);
  const PORT = Config.PORT || 8000;
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(graphqlUploadExpress());
  app.use(
    cors({
      origin: '*',
    })
  );
  app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is healthy.' });
  });
  app.use(
    '/graphql',
    expressMiddleware(await createApolloGraphQLServer(app), {
      context: async ({ req }) => {
        return UserService.deserializeUser(req);
      },
    })
  );

  socketService.io.attach(server);
  socketService.initListeners();

  server.listen(PORT, () => {
    console.log(`Server listening at PORT-${PORT}`);
  });
}
init();
