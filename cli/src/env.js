import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  ENTITY_COMMAND_URL,
  MONGO_URL,
  REDIS_PUBSUB_HOST,
  REDIS_PUBSUB_PORT,
  SQS_QUEUE_URL,
  TOKEN_SECRET,
} = cleanEnv(process.env, {
  AWS_ACCESS_KEY_ID: str({ desc: 'The AWS access key ID.' }),
  AWS_REGION: str({ desc: 'The AWS region to connect to.', default: 'us-east-2' }),
  AWS_SECRET_ACCESS_KEY: str({ desc: 'The AWS secret access key.' }),
  ENTITY_COMMAND_URL: str({ desc: 'The entity command service URL' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  REDIS_PUBSUB_HOST: str({ desc: 'The Redis PubSub host to connect to.' }),
  REDIS_PUBSUB_PORT: str({ desc: 'The Redis PubSub port to connect to.' }),
  SQS_QUEUE_URL: str({ desc: 'The event store SQS queue to send event messages to.' }),
  TOKEN_SECRET: str({ desc: 'The user token signing secret.' }),
});
