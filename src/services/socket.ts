import { Server } from 'socket.io';
import { pub, sub } from '../lib/redis';
import { produceMessage } from './kafka';
import { MessagePayload } from '../utils/types';
class SocketService {
  private _io: Server;
  constructor() {
    this._io = new Server({
      cors: {
        origin: '*',
        allowedHeaders: ['*'],
      },
    });
    // Subscribing to Redis Channel
    sub.subscribe('MESSAGES');
  }
  public initListeners() {
    let io = this.io;

    io.on('connection', (socket) => {
      // User or Group Join
      socket.on('joinChat', (chatId) => {
        socket.join(chatId);
      });
      // When user send's message
      socket.on('message', async ({ message, chatId, file, userId }) => {
        // Sending message to Redis
        await pub.publish(
          'MESSAGES',
          JSON.stringify({ message, chatId, file, userId })
        );
      });
    });
    // Listening For messages in Redis
    sub.on('message', async (channel, message) => {
      const data = JSON.parse(message) as MessagePayload;
      if (channel === 'MESSAGES') {
        await produceMessage(data);
        io.to(data.chatId).emit('message', data.message);
      }
    });
  }
  get io() {
    return this._io;
  }
}

export default SocketService;
