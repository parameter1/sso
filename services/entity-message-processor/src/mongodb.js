import { MongoClient } from '@parameter1/sso-mongodb-core';
import { NormalizedRepoManager } from '@parameter1/sso-mongodb-normalized';
import { Materializer } from '@parameter1/sso-mongodb-materializers';
import { Normalizer } from '@parameter1/sso-mongodb-normalizers';

import { MONGO_URL } from './env.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const normalizer = new Normalizer({ mongo });

export const materializers = new Materializer({
  normalizedRepoManager: new NormalizedRepoManager({ mongo }),
});
