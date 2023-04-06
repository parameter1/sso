import {
  cleanEnv,
  str,
} from 'envalid';

export const {
  ENTITY_COMMAND_URL,
  MONGO_URL,
  MONGO_URL_AQUARIA,
  MONGO_URL_TAURON,
  MONGO_URL_VIRGON,
} = cleanEnv(process.env, {
  ENTITY_COMMAND_URL: str({ desc: 'The entity command service URL' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  MONGO_URL_AQUARIA: str({ desc: 'The aquaria MongoDB URL to connect to.' }),
  MONGO_URL_TAURON: str({ desc: 'The tauron MongoDB URL to connect to.' }),
  MONGO_URL_VIRGON: str({ desc: 'The virgon MongoDB URL to connect to.' }),
});
