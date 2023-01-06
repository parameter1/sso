import { ApolloServer } from '@apollo/server';
import { fastifyApolloDrainPlugin, fastifyApolloHandler } from '@as-integrations/fastify';
import Fastify from 'fastify';
import { AuthContext, onShutdownPlugin, formatServerError } from '@parameter1/sso-graphql';

import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import schema from './schema.js';
import { userManager } from './service-clients.js';

/**
 *
 * @param {object} params
 * @param {import("fastify").FastifyServerOptions} [params.fastifyOpts]
 * @param {Function} [params.onHealthCheck]
 * @param {Function} [params.onShutdown]
 * @param {string} [params.path=/graphql]
 * @returns {import("fastify").FastifyInstance}
 */
export async function createServer({
  fastifyOpts,
  onHealthCheck,
  onShutdown,
  path = '/graphql',
} = {}) {
  const fastify = Fastify(fastifyOpts);

  const wsServer = new WebSocketServer({
    server: fastify.server,
    path,
  });
  const serverCleanup = useServer({
    schema,
    context: ({ connectionParams = {} }) => ({
      auth: AuthContext({ header: connectionParams.authorization, userManager }),
    }),
  }, wsServer);

  const apollo = new ApolloServer({
    formatError: (e, ...rest) => {
      const formatted = formatServerError(e, ...rest);
      // @todo eventually log errors
      return formatted;
    },
    introspection: true,
    persistedQueries: false,
    plugins: [
      fastifyApolloDrainPlugin(fastify),
      onShutdownPlugin({ fn: onShutdown }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    schema,
  });

  await apollo.start();

  fastify.route({
    url: path,
    method: ['GET', 'POST'],
    handler: fastifyApolloHandler(apollo),
  });

  fastify.route({
    url: '/.well-known/apollo/server-health',
    method: ['HEAD', 'GET'],
    handler: async (_, reply) => {
      if (typeof onHealthCheck === 'function') await onHealthCheck();
      reply.send({ ok: true });
    },
  });
  return fastify;
}
