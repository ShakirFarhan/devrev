import { Server } from 'socket.io';
import { pub, sub } from '../lib/redis';
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
      socket.on('message', async ({ message, chat }) => {
        // Sending message to Redis
        await pub.publish('MESSAGES', JSON.stringify({ message, chat }));
      });
    });
    // Listening For messages in Redis
    sub.on('message', (channel, message) => {
      const data = JSON.parse(message) as { chat: string; message: string };
      if (channel === 'MESSAGES') {
        console.log('Message Recieved from redis', message);
        io.emit('message', data);
      }
    });
  }
  get io() {
    return this._io;
  }
}

export default SocketService;
