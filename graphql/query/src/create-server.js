import { ApolloServer } from '@apollo/server';
import { fastifyApolloDrainPlugin, fastifyApolloHandler } from '@as-integrations/fastify';
import cors from '@fastify/cors';
import { AuthContext, onShutdownPlugin, formatServerError } from '@parameter1/sso-graphql';
import Fastify from 'fastify';

import schema from './schema.js';
import { materialized } from './mongodb.js';
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

  const apollo = new ApolloServer({
    formatError: (e) => {
      const formatted = formatServerError(e);
      // @todo eventually log errors
      return formatted;
    },
    introspection: true,
    plugins: [
      fastifyApolloDrainPlugin(fastify),
      onShutdownPlugin({ fn: onShutdown }),
    ],
    schema,
  });

  await apollo.start();

  // @todo determine how to handle CORS?
  fastify.route({
    url: path,
    method: ['GET', 'POST'],
    handler: fastifyApolloHandler(apollo, {
      context: (request) => ({
        auth: AuthContext({ header: request.headers.authorization, userManager }),
        dataloaders: materialized.createDataloaders(),
        ip: request.ip,
        ua: request.headers['user-agent'],
      }),
    }),
  });

  fastify.route({
    url: '/.well-known/apollo/server-health',
    method: ['HEAD', 'GET'],
    handler: async (_, reply) => {
      if (typeof onHealthCheck === 'function') await onHealthCheck();
      reply.send({ ok: true });
    },
  });

  await fastify.register(cors, {
    origin: true,
    maxAge: 86400,
    methods: ['GET', 'POST'],
  });

  return fastify;
}
