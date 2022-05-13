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

const APPLICATION_EXISTS = gql`
  query SSOClientDoesApplicationExist($input: QueryApplicationExistsInput!) {
    result: applicationExists(input: $input)
  }
`;

const WORKSPACE_EXISTS = gql`
  query SSOClientDoesWorkspaceExist($input: QueryWorkspaceExistsInput!) {
    result: workspaceExists(input: $input)
  }
`;

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
     * @param {string|ObjectId} params._id The application ID to check.
     * @returns {Promise<boolean>} The current user.
     */
    doesApplicationExist: async (params) => {
      const { _id } = attempt(params, object({
        _id: objectId().required(),
      }).required());
      const variables = { input: { _id } };
      const { data } = await graphql.query({ query: APPLICATION_EXISTS, variables });
      return data.result;
    },

    /**
     *
     * @param {object} params
     * @param {string|ObjectId} params._id The workspace ID to check.
     * @param {string|ObjectId} [params.applicationId] The optional application ID to also check.
     * @returns {Promise<boolean>} The current user.
     */
    doesWorkspaceExist: async (params) => {
      const { _id, applicationId } = attempt(params, object({
        _id: objectId().required(),
        applicationId: objectId(),
      }).required());
      const variables = { input: { _id, applicationId } };
      const { data } = await graphql.query({ query: WORKSPACE_EXISTS, variables });
      return data.result;
    },

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

    /**
     *
     */
    graphql,
  };
}
