import { ApolloServer } from 'apollo-server-fastify';
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';
import fastify from 'fastify';
import {
  formatServerError,
  AuthContext,
  CloseFastifyPlugin,
  OnShutdownPlugin,
} from '@parameter1/sso-graphql';

import schema from './schema.js';
import { userManager } from './mongodb.js';

const isProduction = process.env.NODE_ENV === 'production';

export default async (options = {}) => {
  const app = fastify(options.fastify);

  const apollo = new ApolloServer({
    cache: 'bounded',
    csrfPrevention: true,
    persistedQueries: false,
    context: ({ request }) => ({
      auth: AuthContext({ header: request.headers.authorization, userManager }),
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
    path: '/command',
    onHealthCheck: options.onHealthCheck,
  }));
  return app;
};
