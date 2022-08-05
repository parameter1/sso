import { ApolloError } from 'apollo-server-core';

export class NotFoundError extends ApolloError {
  constructor(message) {
    super(message, 'NOT_FOUND');
    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
    Object.defineProperty(this, 'statusCode', { value: 404 });
  }
}
