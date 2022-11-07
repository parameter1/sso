import { MongoClient } from '@parameter1/mongodb-core';
import { MaterializedRepoManager } from '@parameter1/sso-mongodb-materialized';

import { MONGO_URL } from './env.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const materialized = new MaterializedRepoManager({ mongo });
