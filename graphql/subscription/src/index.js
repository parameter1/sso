import { immediatelyThrow } from '@parameter1/utils';
import pkg from '../package.js';
import createServer from './create-server.js';
import {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
} from './env.js';
import { pubSubManager } from './pubsub.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here
  await Promise.all([
    (async () => {
      log('> Connecting to Redis pub/sub...');
      await pubSubManager.connect();
      log('> Redis pub/sub connected.');
    })(),
  ]);

  const server = await createServer({
    fastify: {
      trustProxy: ['loopback', 'linklocal', 'uniquelocal'],
    },
    onHealthCheck: async () => {
      await Promise.all([
        pubSubManager.ping(),
      ]);
      return true;
    },
    onShutdown: async () => {
      // stop services here
      await Promise.all([
        pubSubManager.quit(),
      ]);
    },
  });

  await server.listen({ host: HOST, port: PORT });
  log(`Ready on http://${EXPOSED_HOST}:${EXPOSED_PORT}/subscription`);
})().catch(immediatelyThrow);
