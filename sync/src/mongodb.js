import { MongoClient } from '@parameter1/mongodb-core';
import basedb from '@parameter1/base-cms-db';
import { MaterializedRepoManager } from '@parameter1/sso-mongodb-materialized';
import { NormalizedRepoManager } from '@parameter1/sso-mongodb-normalized';
import { Materializer } from '@parameter1/sso-mongodb-materializers';
import { Normalizer } from '@parameter1/sso-mongodb-normalizers';

import {
  MONGO_URL,
  MONGO_URL_AQUARIA,
  MONGO_URL_TAURON,
  MONGO_URL_VIRGON,
} from './env.js';
import pkg from '../package.js';

const { createMongoClient } = basedb;

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const aquaria = new MongoClient(MONGO_URL_AQUARIA, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const tauron = createMongoClient(MONGO_URL_TAURON, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const virgon = createMongoClient(MONGO_URL_VIRGON, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const normalizedRepoManager = new NormalizedRepoManager({ mongo });
export const materializedRepoManager = new MaterializedRepoManager({ mongo });
export const materializer = new Materializer({ normalizedRepoManager });

export const normalizer = new Normalizer({ mongo });
