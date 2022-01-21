import { Repos } from '@parameter1/sso-db';
import client from './mongodb.js';
import { MONGO_DB_NAME, TOKEN_SECRET } from './env.js';

export default new Repos({ client, dbName: MONGO_DB_NAME, tokenSecret: TOKEN_SECRET });
