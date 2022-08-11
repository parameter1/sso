export default class GraphQLError extends Error {
  constructor(error) {
    super(error.message);

    Error.captureStackTrace(this, GraphQLError);

    this.name = 'GraphQLError';
    Object.assign(this, error);
  }
}
