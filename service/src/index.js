import { bootService, log } from '@parameter1/terminus';
import { immediatelyThrow } from '@parameter1/utils';
import { filterMongoURL } from '@parameter1/sso-db';
import mongodb from './mongodb.js';
import server from './server.js';
import pkg from '../package.js';
import {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
} from './env.js';

process.on('unhandledRejection', immediatelyThrow);

bootService({
  name: pkg.name,
  version: pkg.version,
  server,
  host: HOST,
  port: PORT,
  exposedHost: EXPOSED_HOST,
  exposedPort: EXPOSED_PORT,

  onStart: async () => {
    log('Conecting to MongoDB...');
    const client = await mongodb.connect();
    log(`MongoDB connected. ${filterMongoURL(client)}`);
  },

  onSignal: async () => {
    log('Closing MongoDB...');
    await mongodb.close();
    log('MongoDB closed.');
  },

  onHealthCheck: async () => {
    await mongodb.ping({ id: pkg.name });
  },
}).catch(immediatelyThrow);
