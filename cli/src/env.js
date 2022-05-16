import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  MANAGED_MONGO_DB_NAME,
  MATERIALIZED_MONGO_DB_NAME,
  MONGO_URL,
  TOKEN_SECRET,
} = cleanEnv(process.env, {
  MANAGED_MONGO_DB_NAME: str({ desc: 'The managed MongoDB database name to use.', default: 'sso@managed' }),
  MATERIALIZED_MONGO_DB_NAME: str({ desc: 'The materialized MongoDB database name to use.', default: 'sso@materialized' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  TOKEN_SECRET: str({ desc: 'The secret to use when signing tokens.' }),
});
