import { attempt, PropTypes } from '@parameter1/prop-types';
import { gql } from '@parameter1/graphql/tag';
import { extractFragmentData } from '@parameter1/graphql/fragments';

import GraphQLClient from './graphql.js';

const {
  alternatives,
  object,
  objectId,
  string,
} = PropTypes;

/**
 * Creates the SSO client instance.
 *
 * @param {object} options
 * @param {string} options.appId The active SSO application ID.
 * @param {string} options.graphqlUrl The SSO GraphQL URL to connect to.
 * @param {string} options.name The client name.
 * @param {string} options.version The client version.
 * @param {object} [options.headers] Headers to send with all requests.
 */
export default function SSOClient(options) {
  const {
    graphqlUrl,
    name,
    version,
    headers: globalHeaders,
  } = attempt(options, object({
    appId: objectId().required(),
    graphqlUrl: string().required(),
    name: string().required(),
    version: string().required(),
    headers: object().unknown(),
  }).required());

  const graphql = GraphQLClient({
    url: graphqlUrl,
    name,
    version,
    headers: globalHeaders,
  });

  return {
    /**
     *
     * @param {object} params
     * @param {string} params.authToken The user authentication token to use.
     * @param {object} [params.fragment] The query fragment to use.
     * @returns {Promise<object>} The current user.
     */
    getCurrentUser: async (params) => {
      const { authToken, fragment } = attempt(params, object({
        authToken: string().required(),
        fragment: alternatives().try(string(), object()),
      }).required());

      const { processedFragment, spreadFragmentName } = extractFragmentData(fragment);
      const query = gql`
        query SSOClientGetCurrentUser {
          currentUser {
            _id
            ${spreadFragmentName}
          }
        }
        ${processedFragment}
      `;
      const headers = { authorization: `Bearer ${authToken}` };
      const { data } = await graphql.query({ query, headers });
      return data.currentUser;
    },
  };
}
