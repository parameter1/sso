import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  ENTITY_COMMAND_URL,
  MONGO_URL,
  USER_URL,
} = cleanEnv(process.env, {
  ENTITY_COMMAND_URL: str({ desc: 'The entity command service URL' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  USER_URL: str({ desc: 'The user service URL' }),
});
