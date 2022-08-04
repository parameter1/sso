import { MongoDBClient, EntityManager, UserManager } from '@parameter1/sso-mongodb';
import { MONGO_URL, TOKEN_SECRET } from './env.js';
import pkg from '../package.js';

export const mongodb = new MongoDBClient({
  url: MONGO_URL,
  options: { appname: `${pkg.name} v${pkg.version}` },
});

export const entityManager = new EntityManager({ client: mongodb });

export const userManager = new UserManager({
  client: mongodb,
  entityManager,
  tokenSecret: TOKEN_SECRET,
});
