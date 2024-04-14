import { Server } from 'socket.io';
import { pub, sub } from '../lib/redis';
import { produceMessage } from './kafka';
import { MessagePayload, EmitNotificationPayload } from '../utils/types';

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

      console.log('userId: ', userId);
      console.log('Socket Id: ', socket.id);
      socket.on('mapIds', async (data) => {
        if (!userId) return;

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
      socket.on(
        'message',
        async ({ message, chat, file, sender, createdAt }) => {
          // Sending message to Redis
          await pub.publish(
            'MESSAGES',
            JSON.stringify({ message, chat, file, sender, createdAt })
          );
        }
      );
      // When user Disconnects
      socket.on('disconnectUser', async () => {
        const mapExists = await pub.hget('userSocketMapping', userId);

        if (mapExists) {
          if (mapExists !== socket.id) return;
          pub.hdel('userSocketMapping', userId);
        }
        return;
      });
    });
    // Listening For messages in Redis
    sub.on('message', async (channel, message) => {
      if (channel === 'MESSAGES') {
        // Handling Chat Messages Related Data.
        const data = JSON.parse(message) as MessagePayload;
        await produceMessage(data, 'MESSAGES');

        io.to(data.chat).emit('message', data);
      } else if (channel === 'NOTIFICATIONS') {
        // Handling Notifications Related Data.
        // await produceMessage(data,"NOTIFICATIONS")
        const data = JSON.parse(message) as EmitNotificationPayload;

        let recipientSocketId = (await SocketService.getSocketByUserId(
          data.recipient.id
        )) as string;

        io.to(recipientSocketId).emit('getNotification', JSON.parse(message));
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
