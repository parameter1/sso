import { MongoDBClient } from '@tenancy/db';
import { MONGO_URL } from './env.js';
import pkg from '../package.js';

export default new MongoDBClient({
  url: MONGO_URL,
  options: { appname: `${pkg.name} v${pkg.version}` },
});
