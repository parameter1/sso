import GraphQLClient from './graphql.js';

/**
 * Creates an SSO Workspace and GraphQL client
 *
 * @param {object} params
 * @param {string} params.id The SSO Workspace ID.
 * @param {ojbect} params.url The SSO GraphQL URL to connect to.
 * @param {string} [params.name] The client name.
 * @param {string} [params.version] The client version.
 * @param {object} [params.headers] Headers to send with all requests.
 * @returns {object}
 */
export default function WorkspaceClient({
  id,
  url,
  name,
  version,
  headers,
}) {
  const graphql = GraphQLClient({
    url,
    name,
    version,
    headers,
  });

  return { id, graphql };
}
