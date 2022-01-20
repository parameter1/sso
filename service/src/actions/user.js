import repos from '../repos.js';

export default {
  /**
   *
   * @param {object} params
   * @param {string} params.email
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  createLoginLinkToken: ({ email, ip, ua } = {}) => repos.$('user').createLoginLinkToken({
    email,
    ip,
    ua,
  }),

  /**
   *
   * @param {object} params
   * @param {string} params.loginLinkToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  magicLogin: ({ loginLinkToken, ip, ua } = {}) => repos.$('user').magicLogin({
    loginLinkToken,
    ip,
    ua,
  }),

  /**
   * @param {object} params
   * @param {string} params.token
   * @param {object} [params.projection]
   */
  verifyAuthToken: ({ token, projection }) => repos.$('user').verifyAuthToken({
    token,
    projection,
  }),
};
