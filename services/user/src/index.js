import { filterMongoURL } from '@parameter1/sso-mongodb-core';
import { bootService } from '@parameter1/terminus';
import { immediatelyThrow } from '@parameter1/utils';
import process from 'process';

import {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
} from './env.js';
import pkg from '../package.js';
import { mongo } from './mongodb.js';
import server from './server.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

bootService({
  name: pkg.name,
  version: pkg.version,
  server,

  host: HOST,
  port: PORT,
  exposedHost: EXPOSED_HOST,
  exposedPort: EXPOSED_PORT,

  onStart: async () => {
    await Promise.all([
      (async () => {
        log('Connecting to MongoDB...');
        await mongo.connect();
        log(`MongoDB connected on ${filterMongoURL(mongo)}`);
      })(),
    ]);
  },
  onSignal: async () => {
    await Promise.all([
      mongo.close(),
    ]);
  },
  onHealthCheck: async () => {
    await Promise.all([
      mongo.db('test').command({ ping: 1 }),
    ]);
    return true;
  },
}).catch(immediatelyThrow);
