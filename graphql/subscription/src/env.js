import {
  cleanEnv,
  port,
  str,
} from 'envalid';

export const {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
  REDIS_PUBSUB_HOST,
  REDIS_PUBSUB_PORT,
  USER_URL,
} = cleanEnv(process.env, {
  EXPOSED_HOST: str({ desc: 'The host that the service is exposed on.', default: '0.0.0.0' }),
  EXPOSED_PORT: port({ desc: 'The port that the service is exposed on.', default: 80 }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
  REDIS_PUBSUB_HOST: str({ desc: 'The Redis PubSub host to connect to.' }),
  REDIS_PUBSUB_PORT: str({ desc: 'The Redis PubSub port to connect to.' }),
  USER_URL: str({ desc: 'The user service URL' }),
});
