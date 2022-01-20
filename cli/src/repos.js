import { Repos } from '@tenancy/db';
import client from './mongodb.js';
import { MONGO_DB_NAME } from './env.js';

export default new Repos({ client, dbName: MONGO_DB_NAME });
