import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  ENTITY_PROCESSOR_URL,
  SQS_QUEUE_URL,
} = cleanEnv(process.env, {
  AWS_ACCESS_KEY_ID: str({ desc: 'The AWS access key ID.' }),
  AWS_REGION: str({ desc: 'The AWS region to connect to.', default: 'us-east-2' }),
  AWS_SECRET_ACCESS_KEY: str({ desc: 'The AWS secret access key.' }),
  ENTITY_PROCESSOR_URL: str({ desc: 'The entity processor service URL' }),
  SQS_QUEUE_URL: str({ desc: 'The event store SQS queue to send event messages to.' }),
});
