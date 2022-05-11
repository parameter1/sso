import { ApolloError, AuthenticationError } from 'apollo-server-fastify';

export default class Errors {
  /**
   *
   * @param {string} message
   * @returns {ApolloError}
   */
  static forbidden(message) {
    const e = new ApolloError(message);
    e.statusCode = 403;
    return e;
  }

  /**
   *
   * @param {string} message
   * @returns {AuthenticationError}
   */
  static notAuthenticated(message) {
    return new AuthenticationError(message);
  }

  /**
   *
   * @returns {ApolloError}
   */
  static improperUserPerms() {
    return Errors.forbidden('You do not have the proper permissions to perform this operation.');
  }
}
