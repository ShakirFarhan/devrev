import { Kafka, Producer } from 'kafkajs';
import {
  KAFKA_HOST,
  KAFKA_PASSWORD,
  KAFKA_PORT,
  KAFKA_USERNAME,
} from '../config';
import path from 'path';
import fs from 'fs';
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
  console.log('Producer Created.');
  return producer;
}
// Manages the message delivery to Kafka
export async function produceMessage(message: string) {
  const producer = await createProducer();
  await producer.send({
    messages: [{ key: message + Date.now(), value: message }],
    topic: 'MESSAGES',
  });
  return true;
}
// Handles the message storage from Kafka to the database
export async function messageConsumer() {
  const consumer = kafka.consumer({ groupId: 'default' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'MESSAGES', fromBeginning: true });
  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ message, pause }) => {
      if (!message.value) return;
      try {
        // Store Messags in the database
      } catch (error) {
        // Delays the consumer's activity in case of an error
        pause();
        setTimeout(() => {
          consumer.resume([{ topic: 'MESSAGES' }]);
        }, 60 * 1000);
      }
    },
  });
}

export default kafka;
