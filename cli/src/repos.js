import { ManagedRepos, MaterializedRepos } from '@parameter1/sso-mongodb';
import client from './mongodb.js';
import { MANAGED_MONGO_DB_NAME, MATERIALIZED_MONGO_DB_NAME, TOKEN_SECRET } from './env.js';
import pkg from '../package.js';

export default new ManagedRepos({
  client,
  dbName: MANAGED_MONGO_DB_NAME,
  tokenSecret: TOKEN_SECRET,
  source: { name: pkg.name, v: pkg.version },
});

export const materializedRepos = new MaterializedRepos({
  client,
  dbBame: MATERIALIZED_MONGO_DB_NAME,
});
