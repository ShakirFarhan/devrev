import { Kafka, Producer } from 'kafkajs';
import {
  KAFKA_HOST,
  KAFKA_PASSWORD,
  KAFKA_PORT,
  KAFKA_USERNAME,
} from '../config';
import path from 'path';
import fs from 'fs';
import ChatService from './chat';
import { MessagePayload } from '../utils/types';
import { prismaClient } from '../lib/db';
let producer: null | Producer;
// Kafka Setup
const kafka = new Kafka({
  brokers: [`${KAFKA_HOST}:${KAFKA_PORT}`],
  ssl: {
    ca: [fs.readFileSync(path.resolve('./ca.pem'), 'utf-8')],
  },
  sasl: {
    username: KAFKA_USERNAME as string,
    password: KAFKA_PASSWORD as string,
    mechanism: 'plain',
  },
});
// Creates a Producer, If exists returns same Producer
export async function createProducer() {
  if (producer) return producer;
  const _producer = kafka.producer();
  await _producer.connect();
  producer = _producer;
  return producer;
}
// Manages the message delivery to Kafka
export async function produceMessage(
  // This payload can be of different types not just Message related.
  message: MessagePayload,
  topic: 'MESSAGES'
) {
  const producer = await createProducer();
  await producer.send({
    messages: [
      { key: message.sender.id + Date.now(), value: JSON.stringify(message) },
    ],
    topic: topic,
  });
  return true;
}

// Handles the message storage from Kafka to the database
export async function messageConsumer() {
  const consumer = kafka.consumer({ groupId: 'default' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'MESSAGES', fromBeginning: true });
  // await consumer.subscribe({ topic: 'NOTIFICATIONS', fromBeginning: true });
  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ message, pause, topic }) => {
      if (!message.value) return;
      // Handling Chat Related Data
      if (topic === 'MESSAGES') {
        try {
          // Storing Messages in DB
          let data = JSON.parse(message.value.toString()) as MessagePayload;
          await ChatService.sendMessage(data);
        } catch (error) {
          // Delays the consumer's activity in case of an error
          console.error(
            'Error occurred while storing message in database:',
            error
          );
          pause();
          setTimeout(() => {
            consumer.resume([{ topic: 'MESSAGES' }]);
          }, 60 * 1000);
        }
      }
    },
  });
}

export default kafka;
