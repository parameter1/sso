import { ManagedRepos } from '@parameter1/sso-mongodb';
import client from '../mongodb.js';
import { MONGO_DB_NAME, TOKEN_SECRET } from '../env.js';
import pkg from '../../package.js';

export default new ManagedRepos({
  client,
  dbName: MONGO_DB_NAME,
  tokenSecret: TOKEN_SECRET,
  source: { name: pkg.name, v: pkg.version },
});
