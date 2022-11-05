import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  ENTITY_COMMAND_URL,
  ENTITY_MATERIALIZER_URL,
  ENTITY_NORMALIZER_URL,
  MONGO_URL,
} = cleanEnv(process.env, {
  ENTITY_COMMAND_URL: str({ desc: 'The entity command client URL' }),
  ENTITY_MATERIALIZER_URL: str({ desc: 'The entity materializer client URL' }),
  ENTITY_NORMALIZER_URL: str({ desc: 'The entity normalizer client URL' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
});
