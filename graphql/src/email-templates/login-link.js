import { PropTypes, validate } from '@parameter1/sso-prop-types';
import { APP_URL } from '../env.js';

const { object, string } = PropTypes;

/**
 * @param {object} params
 * @param {string} params.loginToken
 * @param {string} [params.redirectTo]
 */
export default (params = {}) => {
  const { loginToken, redirectTo } = validate(object({
    loginToken: string().required(),
    redirectTo: string().allow(null),
  }).required(), params);

  let url = `${APP_URL}/authenticate?token=${loginToken}`;
  if (redirectTo) url = `${url}&next=${encodeURIComponent(redirectTo)}`;

  return {
    subject: 'Your personal login link',
    html: `
      <p>You requested to login.</p>
      <p><a href="${url}">Login</a></p>
    `,
    text: `
      You requested to login.
      Link: ${url}
    `,
  };
};
