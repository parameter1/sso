import { ApolloError } from 'apollo-server-core';

export class ForbiddenError extends ApolloError {
  constructor(message) {
    super(message, 'FORBIDDEN');
    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
    Object.defineProperty(this, 'statusCode', { value: 403 });
  }
}
