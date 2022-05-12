import { attempt, PropTypes } from '@parameter1/prop-types';
import { gql } from '@parameter1/graphql/tag';
import { extractFragmentData } from '@parameter1/graphql/fragments';

import GraphQLClient from './graphql.js';

const {
  object,
  objectId,
  string,
  url,
} = PropTypes;

/**
 * Creates the SSO client instance.
 *
 * @param {object} params
 * @param {string} params.appId The active SSO application ID.
 * @param {string} params.graphqlUrl The SSO GraphQL URL to connect to.
 * @param {string} params.name The client name.
 * @param {string} params.version The client version.
 * @param {object} [params.headers] Headers to send with all requests.
 */
export default function SSOClient(params) {
  const {
    graphqlUrl,
    name,
    version,
    headers,
  } = attempt(params, object({
    appId: objectId().required(),
    graphqlUrl: url().required(),
    name: string().required(),
    version: string().required(),
    headers: object().unknown(),
  }).required());

  const graphql = GraphQLClient({
    url: graphqlUrl,
    name,
    version,
    headers,
  });

  return {
    /**
     *
     * @param {object} params
     * @param {object} params.fragment The query fragment to use.
     * @returns {Promise<object>} The current user.
     */
    getCurrentUser: async ({ fragment } = {}) => {
      const { processedFragment, spreadFragmentName } = extractFragmentData(fragment);
      const query = gql`
        query SSOClientGetCurrentUser {
          currentUser {
            _id
            ...${spreadFragmentName}
          }
        }
        ${processedFragment};
      `;
      const { data } = await graphql.query({ query });
      return data.currentUser;
    },
  };
}
