import { AuthenticationError as BaseAuthenticationError } from 'apollo-server-core';

export class AuthenticationError extends BaseAuthenticationError {
  constructor(...args) {
    super(...args);
    Object.defineProperty(this, 'statusCode', { value: 401 });
  }
}
