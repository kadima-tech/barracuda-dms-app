"use strict";
// import { PubSub } from '@google-cloud/pubsub';
// import config from '../config';
// export const pubSubClient = new PubSub({ projectId: config.PROJECT_ID });
// export const subscribe = (
//   topicName: string,
//   subscriptionName: string,
//   adapter: (data: Uint8Array) => Promise<void>
// ) => {
//   const topic = pubSubClient.topic(topicName);
//   const subscription = topic.subscription(subscriptionName, {
//     flowControl: { maxMessages: 10 },
//   });
//   subscription.on('message', async (message) => {
//     try {
//       await adapter(new Uint8Array(message.data));
//     } catch (e) {
//       // TODO: Determine if we can recover or not and nack/ack accordingly
//     } finally {
//       message.ack();
//     }
//   });
// };
