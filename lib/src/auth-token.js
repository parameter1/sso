export const TOKEN_KEY = '__p1-sso-token';

export class AuthToken {
  /**
   * @returns {boolean}
   */
  static exists() {
    return Boolean(AuthToken.get());
  }

  /**
   * @returns {string|null}
   */
  static get() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  static getKey() {
    return TOKEN_KEY;
  }

  static remove() {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * @param {string} token The JWT string
   */
  static set(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static setFromQuery() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get(TOKEN_KEY);
    if (token) AuthToken.set(token);
  }
}
