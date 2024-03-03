import { Server } from 'socket.io';
import { pub, sub } from '../lib/redis';
import { produceMessage } from './kafka';
import { MessagePayload, EmitNotificationPayload } from '../utils/types';
import { catchErrorHandler } from '../utils/error-handler';

class SocketService {
  private _io: Server;
  constructor() {
    this._io = new Server({
      cors: {
        origin: '*',
        allowedHeaders: ['*'],
      },
    });
    // Subscribing to Redis Channels
    sub.subscribe('MESSAGES');
    sub.subscribe('NOTIFICATIONS');
  }
  public initListeners() {
    let io = this.io;

    io.on('connection', (socket) => {
      let userId = socket.handshake.query?.userId as string;
      // Storing Socket Id with User Id
      socket.on('setUserId', async () => {
        if (await pub.hexists('userSocketMapping', userId)) {
          return;
        }
        await pub.hset('userSocketMapping', userId, socket.id);
      });
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
      // When user Disconnects
      socket.on('disconnect', async () => {
        await pub.hget('userSocketMapping', userId, (err, socketId) => {
          if (err) {
            console.error(
              'Error retrieving userSocketMapping from Redis:',
              err
            );
            return;
          }
          if (socketId !== socket.id) return;
          pub.hdel('userSocketMapping', userId);
        });
      });
    });
    // Listening For messages in Redis
    sub.on('message', async (channel, message) => {
      if (channel === 'MESSAGES') {
        // Handling Chat Messages Related Data.
        const data = JSON.parse(message) as MessagePayload;
        await produceMessage(data, 'MESSAGES');
        io.to(data.chatId).emit('message', data.message);
      } else if (channel === 'NOTIFICATIONS') {
        // Handling Notifications Related Data.
        // await produceMessage(data,"NOTIFICATIONS")
        const data = JSON.parse(message) as EmitNotificationPayload;
        let recipientSocketId = (await SocketService.getSocketByUserId(
          data.recipient.id
        )) as string;
        io.to(recipientSocketId).emit('notification', JSON.parse(message));
      }
    });
  }
  get io() {
    return this._io;
  }

  public static async getSocketByUserId(userId: string) {
    const socketId = await pub.hget('userSocketMapping', userId);
    return socketId;
  }
  public async emitNotification(notification: EmitNotificationPayload) {
    await pub.publish('NOTIFICATIONS', JSON.stringify(notification));
  }
}

export default SocketService;
