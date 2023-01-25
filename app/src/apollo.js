import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  ApolloLink,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { get } from 'object-path';
import { AuthTokenStorage } from './services/token-storage';

const errorLink = onError(({ graphQLErrors: errors }) => {
  if (Array.isArray(errors) && errors.some((error) => get(error, 'extensions.code') === 'UNAUTHENTICATED' || get(error, 'extensions.status') === 401)) {
    // Delete the token and reload the app (to clear all possible cache).
    AuthTokenStorage.remove();
    window.location.href = '/';
  }
});

const contextLink = setContext(() => {
  const headers = {};
  const value = AuthTokenStorage.get();
  if (value) headers.authorization = `Bearer ${value}`;
  return { headers };
});

const command = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    contextLink,
    createHttpLink({
      uri: import.meta.env.VITE_GRAPHQL_COMMAND_URL,
    }),
  ]),
  cache: new InMemoryCache(),
});

const query = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    contextLink,
    createHttpLink({
      uri: import.meta.env.VITE_GRAPHQL_QUERY_URL,
    }),
  ]),
  cache: new InMemoryCache(),
});

const subscription = new ApolloClient({
  link: new GraphQLWsLink(createClient({
    url: import.meta.env.VITE_GRAPHQL_SUBSCRIPTION_URL,
    connectionParams: () => {
      const token = AuthTokenStorage.get();
      return {
        ...(token && { authorization: `Bearer ${token}` }),
      };
    },
  })),
  cache: new InMemoryCache(),
});

export default { query, command, subscription };
