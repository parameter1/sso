import { filterMongoURL } from '@parameter1/mongodb-core';
import { immediatelyThrow } from '@parameter1/utils';
import pkg from '../package.js';
import { createServer } from './create-server.js';
import {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
} from './env.js';
import { mongo } from './mongodb.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here
  log('Connecting to MongoDB...');
  await mongo.connect();
  log(`MongoDB connected on ${filterMongoURL(mongo)}`);

  const path = '/query';
  const server = await createServer({
    fastifyOpts: {
      trustProxy: ['loopback', 'linklocal', 'uniquelocal'],
    },
    onHealthCheck: async () => {
      await mongo.db('test').command({ ping: 1 });
      return true;
    },
    onShutdown: async () => {
      // stop services here
      log('Closing MongoDB...');
      await mongo.close();
      log('MongoDB closed.');
    },
    path,
  });

  await server.listen({ host: HOST, port: PORT });
  log(`Ready on http://${EXPOSED_HOST}:${EXPOSED_PORT}${path}`);
})().catch(immediatelyThrow);
