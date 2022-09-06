import { filterMongoURL } from '@parameter1/sso-mongodb';
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
import server from './server.js';
import { mongodb } from './mongodb.js';

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
    log('Connecting to MongoDB...');
    const client = await mongodb.connect();
    log(`MongoDB connected on ${filterMongoURL(client)}`);
  },

  onSignal: async () => {
    log('Closing MongoDB...');
    await mongodb.close();
    log('MongoDB closed');
  },

  onHealthCheck: async () => {
    await mongodb.ping({ id: pkg.name, withWrite: false });
    return true;
  },
}).catch(immediatelyThrow);
