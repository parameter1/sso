import Joi, { validate } from '@parameter1/joi';
import { APP_URL } from '../env.js';

/**
 * @param {object} params
 * @param {string} params.loginToken
 * @param {string} [params.redirectTo]
 */
export default (params = {}) => {
  const { loginToken, redirectTo } = validate(Joi.object({
    loginToken: Joi.string().required(),
    redirectTo: Joi.string().allow(null),
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
