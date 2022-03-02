import { ManagementRepos } from '@parameter1/sso-mongodb';
import client from './mongodb.js';
import { MONGO_DB_NAME, TOKEN_SECRET } from './env.js';

export default new ManagementRepos({ client, dbName: MONGO_DB_NAME, tokenSecret: TOKEN_SECRET });
