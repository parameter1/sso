import { MongoClient } from '@parameter1/mongodb-core';
import { MaterializedRepoManager } from '@parameter1/sso-mongodb-materialized';
import { NormalizedRepoManager } from '@parameter1/sso-mongodb-normalized';
import { Materializer } from '@parameter1/sso-mongodb-materializers';
import { Normalizer } from '@parameter1/sso-mongodb-normalizers';

import { MONGO_URL } from './env.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const normalizedRepoManager = new NormalizedRepoManager({ mongo });
export const materializedRepoManager = new MaterializedRepoManager({ mongo });
export const materializer = new Materializer({ normalizedRepoManager });

export const normalizer = new Normalizer({ mongo });
