import { MongoClient } from '@parameter1/sso-mongodb-core';
import { NormalizedRepoManager } from '@parameter1/sso-mongodb-normalized';
import { Materializer } from '@parameter1/sso-mongodb-materializers';
import { MaterializedRepoManager } from '@parameter1/sso-mongodb-materialized';

import { MONGO_URL } from './env.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const materializedRepoManager = new MaterializedRepoManager({ mongo });

export const materializers = new Materializer({
  normalizedRepoManager: new NormalizedRepoManager({ mongo }),
});
