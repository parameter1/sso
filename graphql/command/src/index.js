import { immediatelyThrow } from '@parameter1/utils';
import pkg from '../package.js';
import { createServer } from './create-server.js';
import {
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  PORT,
} from './env.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here

  const path = '/command';
  const server = await createServer({
    fastifyOpts: {
      trustProxy: ['loopback', 'linklocal', 'uniquelocal'],
    },
    onHealthCheck: async () => {},
    onShutdown: async () => {},
    path,
  });

  await server.listen({ host: HOST, port: PORT });
  log(`Ready on http://${EXPOSED_HOST}:${EXPOSED_PORT}${path}`);
})().catch(immediatelyThrow);
