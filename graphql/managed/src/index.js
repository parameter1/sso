import { filterMongoURL } from '@parameter1/sso-mongodb';
import { immediatelyThrow } from '@parameter1/utils';
import pkg from '../package.js';
import createServer from './create-server.js';
import {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
} from './env.js';
import mongodb from './mongodb.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here
  log('Connecting to MongoDB...');
  const client = await mongodb.connect();
  log(`MongoDB connected on ${filterMongoURL(client)}`);

  const server = await createServer({
    fastify: {
      trustProxy: ['loopback', 'linklocal', 'uniquelocal'],
    },
    onHealthCheck: async () => {
      await mongodb.ping({ id: pkg.name });
      return true;
    },
    onShutdown: async () => {
      // stop services here
      await mongodb.close();
    },
  });

  await server.listen({ host: HOST, port: PORT });
  log(`Ready on http://${EXPOSED_HOST}:${EXPOSED_PORT}/graphql/managed`);
})().catch(immediatelyThrow);
