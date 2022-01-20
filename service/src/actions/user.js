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
};
