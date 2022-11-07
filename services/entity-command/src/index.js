import { filterMongoURL } from '@parameter1/mongodb-core';
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
import { pubSubManager } from './pubsub.js';
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
      (async () => {
        log('Connecting to Redis pub/sub...');
        await pubSubManager.connect();
        log('Redis connected.');
      })(),
    ]);
  },
  onSignal: async () => {
    await Promise.all([
      mongo.close(),
      pubSubManager.quit(),
    ]);
  },
  onHealthCheck: async () => {
    await Promise.all([
      pubSubManager.ping(),
      mongo.db('test').command({ ping: 1 }),
    ]);
    return true;
  },
}).catch(immediatelyThrow);
