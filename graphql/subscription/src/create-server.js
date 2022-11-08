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
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import schema from './schema.js';
import { userManager } from './service-clients.js';

const isProduction = process.env.NODE_ENV === 'production';

export default async (options = {}) => {
  const app = fastify(options.fastify);

  const wsServer = new WebSocketServer({
    server: app.server,
    path: '/subscription',
  });
  const serverCleanup = useServer({
    schema,
    context: ({ connectionParams = {} }) => ({
      auth: AuthContext({ header: connectionParams.authorization, userManager }),
    }),
  }, wsServer);

  const apollo = new ApolloServer({
    cache: 'bounded',
    csrfPrevention: true,
    persistedQueries: false,
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
    formatError: formatServerError,
  });

  await apollo.start();
  app.register(apollo.createHandler({
    path: '/subscription',
    onHealthCheck: options.onHealthCheck,
  }));
  return app;
};
