import parseJSON from './parse-json';

export const TOKEN_KEY = '__p1-sso-token';

export class AuthToken {
  static exists() {
    return Boolean(AuthToken.get());
  }

  static get() {
    return parseJSON(localStorage.getItem(TOKEN_KEY));
  }

  static getKey() {
    return TOKEN_KEY;
  }

  static remove() {
    localStorage.removeItem(TOKEN_KEY);
  }

  static set(value) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(value));
  }
}
