import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  MONGO_URL,
} = cleanEnv(process.env, {
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
});
