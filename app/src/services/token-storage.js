import { TOKEN_KEY } from '../constants';

export class AuthTokenStorage {
  /**
   * @returns {boolean}
   */
  static exists() {
    return Boolean(AuthTokenStorage.get());
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
}
