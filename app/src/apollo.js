import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  ApolloLink,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { get } from 'object-path';
import tokenStorage from './services/token-storage';

// Cache implementation
const cache = new InMemoryCache();

// Create the apollo client
const client = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors: errors }) => {
      if (Array.isArray(errors) && errors.some((error) => get(error, 'extensions.code') === 'UNAUTHENTICATED' || get(error, 'extensions.status') === 401)) {
        // Delete the token and reload the app (to clear all possible cache).
        tokenStorage.remove();
        window.location.href = '/';
      }
    }),
    setContext(() => {
      const headers = {};
      const token = tokenStorage.get();
      if (token) headers.authorization = `Bearer ${token}`;
      return { headers };
    }),
    createHttpLink({
      // You should use an absolute URL here
      uri: import.meta.env.VITE_GRAPHQL_URL,
    }),
  ]),
  cache,
});

export default client;
