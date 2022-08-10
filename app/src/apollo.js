import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  ApolloLink,
  split,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { get } from 'object-path';
import tokenStorage from './services/token-storage';

const wsLink = new GraphQLWsLink(createClient({
  url: import.meta.env.VITE_GRAPHQL_SUBSCRIPTIONS_URL,
  connectionParams: () => {
    const token = get(tokenStorage.get(), 'value');
    return {
      ...(token && { authorization: `Bearer ${token}` }),
    };
  },
}));

const errorLink = onError(({ graphQLErrors: errors }) => {
  if (Array.isArray(errors) && errors.some((error) => get(error, 'extensions.code') === 'UNAUTHENTICATED' || get(error, 'extensions.status') === 401)) {
    // Delete the token and reload the app (to clear all possible cache).
    tokenStorage.remove();
    window.location.href = '/';
  }
});

const contextLink = setContext(() => {
  const headers = {};
  const value = get(tokenStorage.get(), 'value');
  if (value) headers.authorization = `Bearer ${value}`;
  return { headers };
});

const commandHttpLink = ApolloLink.from([
  errorLink,
  contextLink,
  createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_COMMAND_URL,
  }),
]);

const command = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      );
    },
    wsLink,
    commandHttpLink,
  ),
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

export default { query, command };
