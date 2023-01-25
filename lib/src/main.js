import { GraphQLClient } from './graphql-client';
import { AuthToken, TOKEN_KEY } from './auth-token';

export class SSO {
  /**
   *
   * @param {object} params
   * @param {string} params.appKey This application's key.
   * @param {string} params.origin The SSO app origin URL.
   * @param {string} params.graphqlUri The SSO graphql URL to use for querying.
   */
  constructor({
    appKey,
    origin,
    graphqlUri,
  }) {
    if (!appKey) throw new Error('No SSO application key was provided.');
    this.appKey = appKey;
    this.origin = origin;
    this.graphql = new GraphQLClient({ url: graphqlUri });

    // attempt to set the token if set in the query string
    const url = new URL(window.location.href);
    const token = url.searchParams.get(TOKEN_KEY);
    if (token) {
      AuthToken.set(token);
      url.searchParams.delete(TOKEN_KEY);
      window.history.replaceState(null, '', `${url}`);
    }
  }

  async isAuthenticated() {
    const token = AuthToken.get();
    if (!token) return false;
    try {
      const query = 'query SSOCheckAuth { currentUser { _id } }';
      await this.query({ query, autoRedirect: false });
      return true;
    } catch (e) {
      if (!SSO.isUnauthenticatedError(e)) throw e;
      return false;
    }
  }

  /**
   * Performs a GraphQL query that appends the current authentication token.
   *
   * When `autoRedirect` is true, any unauthenticated errors will automatically redirect the user
   * to the SSO app.
   *
   * @param {object} params
   * @param {object} params.query
   * @param {object} [params.variables]
   * @param {boolean} [params.autoRedirect=true]
   */
  async query({ query, variables, autoRedirect = true }) {
    const token = AuthToken.get();
    try {
      const result = await this.graphql.query({
        query,
        variables,
        headers: { ...(token && { authorization: `Bearer ${token}` }) },
      });
      return result;
    } catch (e) {
      if (autoRedirect === true && SSO.isUnauthenticatedError(e)) {
        this.redirectToApp();
        return { data: {} };
      }
      throw e;
    }
  }

  getAppUrl({ next } = {}) {
    const url = new URL(next || window.location.href);
    url.searchParams.delete(TOKEN_KEY); // ensure tokens from the url aren't sent back
    return `${this.origin}/check-auth?next=${encodeURIComponent(`${url}`)}&appKey=${this.appKey}&_=${(new Date()).valueOf()}`;
  }

  redirectToApp({ next } = {}) {
    window.location.href = this.getAppUrl({ next });
  }

  static getAuthToken() {
    return AuthToken.get();
  }

  /**
   *
   * @param {Error} error
   * @returns {boolean}
   */
  static isUnauthenticatedError(error) {
    return error.code === 'UNAUTHENTICATED' || error.statusCode === 401;
  }
}
