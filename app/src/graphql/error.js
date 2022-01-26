import { get } from 'object-path';

class GraphQLError extends Error {
  constructor(e) {
    let { message } = e;

    const networkError = get(e, 'networkError.result.errors.0');
    const graphQLError = get(e, 'graphQLErrors.0');

    if (networkError) message = networkError.message;
    if (graphQLError) message = graphQLError.message;

    super(message.replace(/^GraphQL error: /i, ''));
    this.originalError = e;
    this.networkError = networkError;
    this.graphQLError = graphQLError;
  }
}

export default GraphQLError;
