import { PubSubManager } from '@parameter1/sso-graphql-redis-pubsub';
import { REDIS_PUBSUB_HOST, REDIS_PUBSUB_PORT } from './env.js';

export { COMMAND_PROCESSED } from '@parameter1/sso-graphql-redis-pubsub';

export const pubSubManager = new PubSubManager({
  redis: {
    host: REDIS_PUBSUB_HOST,
    port: REDIS_PUBSUB_PORT,
  },
});
