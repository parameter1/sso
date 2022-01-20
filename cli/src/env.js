import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  MONGO_DB_NAME,
  MONGO_URL,
} = cleanEnv(process.env, {
  MONGO_DB_NAME: str({ desc: 'The MongoDB database name to use.', default: 'tenancy' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
});
