import {
  cleanEnv,
  port,
  str,
} from 'envalid';

export const {
  ENTITY_COMMAND_URL,
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
  USER_URL,
} = cleanEnv(process.env, {
  ENTITY_COMMAND_URL: str({ desc: 'The entity command service URL' }),
  EXPOSED_HOST: str({ desc: 'The host that the service is exposed on.', default: '0.0.0.0' }),
  EXPOSED_PORT: port({ desc: 'The port that the service is exposed on.', default: 80 }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
  USER_URL: str({ desc: 'The user service URL' }),
});
