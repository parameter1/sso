const getOperationName = (string) => {
  const matches = /query\s+([a-z0-9]+)[(]?.+{/gi.exec(string);
  if (matches && matches[1]) return matches[1];
  return undefined;
};

export function GraphQLClient({ uri, headers: globalHeaders }) {
  return {
    /**
     * Performs a GraphQL query operation
     *
     * @param {object} params
     * @param {string|object} params.query The GraphQL query as a string or `gql` object
     * @param {object} [params.variables]
     * @param {object} [params.headers]
     * @returns {Promise<object>}
     */
    query: async ({ query, variables, headers }) => {
      const q = typeof query === 'object' ? query.loc.source.body : query;
      const body = JSON.stringify({
        operationName: getOperationName(q),
        variables,
        query: q,
      });

      const res = await fetch(uri, {
        method: 'POST',
        headers: {
          ...globalHeaders,
          ...headers,
          'content-type': 'application/json',
        },
        body,
      });
      const json = await res.json();
      if (!res.ok || (json && json.errors)) {
        if (!json || !json.errors) {
          const err = new Error(`An unknown, fatal GraphQL error was encountered (${res.status})`);
          err.statusCode = res.status;
          throw err;
        }
        const [networkError] = json.errors;
        const err = new Error(networkError.message);
        const { extensions } = networkError;
        err.code = extensions.code;
        err.statusCode = extensions.exception.statusCode;
        throw err;
      }
      return json;
    },
  };
}
