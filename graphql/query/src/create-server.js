import { ApolloServer } from 'apollo-server-fastify';
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';
import fastify from 'fastify';
import {
  CloseFastifyPlugin,
  OnShutdownPlugin,
} from '@parameter1/graphql/plugins';
import { AuthContext, formatServerError } from '@parameter1/sso-graphql';

import schema from './schema.js';
import { entityManager, userManager } from './mongodb.js';

const isProduction = process.env.NODE_ENV === 'production';

export default async (options = {}) => {
  const app = fastify(options.fastify);
  const apollo = new ApolloServer({
    context: async ({ request }) => ({
      auth: AuthContext({ header: request.headers.authorization, userManager }),
      dataloaders: await entityManager.materializedRepos.createDataloaders(),
      ip: request.ip,
      ua: request.headers['user-agent'],
    }),
    schema,
    introspection: true,
    debug: !isProduction,
    plugins: [
      isProduction
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground(),
      CloseFastifyPlugin(app),
      ApolloServerPluginDrainHttpServer({
        httpServer: app.server,
        stopGracePeriodMillis: process.env.SHUTDOWN_GRACE_PERIOD,
      }),
      OnShutdownPlugin({ fn: options.onShutdown }),
    ],
    formatError: formatServerError,
  });

  await apollo.start();
  app.register(apollo.createHandler({
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      maxAge: 86400,
    },
    path: '/query',
    onHealthCheck: options.onHealthCheck,
  }));
  return app;
};
