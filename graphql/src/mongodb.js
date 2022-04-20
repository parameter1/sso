import { MongoDBClient } from '@parameter1/sso-mongodb';
import { MONGO_URL } from './env.js';
import pkg from '../package.js';

export default new MongoDBClient({
  url: MONGO_URL,
  options: { appname: `${pkg.name} v${pkg.version}` },
});
