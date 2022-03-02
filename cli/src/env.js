import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  MONGO_DB_NAME,
  MONGO_URL,
  TOKEN_SECRET,
} = cleanEnv(process.env, {
  MONGO_DB_NAME: str({ desc: 'The MongoDB database name to use.', default: 'sso/management' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  TOKEN_SECRET: str({ desc: 'The secret to use when signing tokens.' }),
});
