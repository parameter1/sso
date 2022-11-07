import {
  cleanEnv,
  port,
  str,
} from 'envalid';

export const {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  MONGO_URL,
  PORT,
  REDIS_PUBSUB_HOST,
  REDIS_PUBSUB_PORT,
  SQS_QUEUE_URL,
} = cleanEnv(process.env, {
  AWS_ACCESS_KEY_ID: str({ desc: 'The AWS access key ID.' }),
  AWS_REGION: str({ desc: 'The AWS region to connect to.', default: 'us-east-2' }),
  AWS_SECRET_ACCESS_KEY: str({ desc: 'The AWS secret access key.' }),
  EXPOSED_HOST: str({ desc: 'The host that the service is exposed on.', default: '0.0.0.0' }),
  EXPOSED_PORT: port({ desc: 'The port that the service is exposed on.', default: 80 }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
  REDIS_PUBSUB_HOST: str({ desc: 'The Redis PubSub host to connect to.' }),
  REDIS_PUBSUB_PORT: str({ desc: 'The Redis PubSub port to connect to.' }),
  SQS_QUEUE_URL: str({ desc: 'The event store SQS queue to send event messages to.' }),
});
