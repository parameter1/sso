import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  MONGO_URL,
  REDIS_PUBSUB_HOST,
  REDIS_PUBSUB_PORT,
} = cleanEnv(process.env, {
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  REDIS_PUBSUB_HOST: str({ desc: 'The Redis PubSub host to connect to.' }),
  REDIS_PUBSUB_PORT: str({ desc: 'The Redis PubSub port to connect to.' }),
});
