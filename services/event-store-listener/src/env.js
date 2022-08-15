import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  COMMAND_PROCESSOR_URL,
  MONGO_URL,
  REDIS_PUBSUB_HOST,
  REDIS_PUBSUB_PORT,
} = cleanEnv(process.env, {
  COMMAND_PROCESSOR_URL: str({ desc: 'The command processor service URL' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  REDIS_PUBSUB_HOST: str({ desc: 'The Redis PubSub host to connect to.' }),
  REDIS_PUBSUB_PORT: str({ desc: 'The Redis PubSub port to connect to.' }),
});
