import {
  cleanEnv,
  port,
  str,
} from 'envalid';

export const {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  MONGO_DB_NAME,
  MONGO_URL,
  PORT,
  TOKEN_SECRET,
} = cleanEnv(process.env, {
  EXPOSED_HOST: str({ desc: 'The host that the service is exposed on.', default: '0.0.0.0' }),
  EXPOSED_PORT: port({ desc: 'The port that the service is exposed on.', default: 80 }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  MONGO_DB_NAME: str({ desc: 'The MongoDB database name to use.', default: 'sso@management' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
  TOKEN_SECRET: str({ desc: 'The secret to use when signing tokens.' }),
});
