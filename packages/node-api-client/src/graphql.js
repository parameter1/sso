import fetch from 'node-fetch';
import pkg from '../package.js';
import GraphQLError from './error.js';

/**
 * Creates a GraphQL client.
 *
 * @param {object} params
 * @param {string} params.url The SSO GraphQL URL to connect to.
 * @param {string} [params.name] The client name.
 * @param {string} [params.version] The client version.
 * @param {object} [params.headers] Headers to send with all requests.
 * @returns {object}
 */
export default function GraphQLClient({
  url,
  name,
  version,
  headers,
} = {}) {
  if (!url) throw new Error('The GraphQL URL is required.');
  const via = [name, version].filter((v) => v).join('/');

  return {
    /**
     * Queries the SSO GraphQL server.
     *
     * @param {object} params
     * @param {string|object} params.query The query operation, either as a string or using gql
     * @param {object} [params.variables] Variables to send with the query.
     * @param {object} [params.headers] Additional headers to send with this request only.
     * @returns {Promise<object>}
     */
    query: async ({ query, variables, headers: reqHeaders } = {}) => {
      if (!query) throw new Error('A query operation must be provided.');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          ...reqHeaders,
          'content-type': 'application/json',
          'user-agent': `${pkg.name}/${pkg.version}${via ? ` (via ${via})` : ''}`,
        },
        body: JSON.stringify({
          query: typeof query === 'string' ? query : query.loc.source.body,
          variables,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.errors) throw new GraphQLError(res, json);
      return json;
    },
  };
}
