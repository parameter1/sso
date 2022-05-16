import { PropTypes, validate } from '@parameter1/prop-types';
import { APP_URL } from '../env.js';

const { object, objectId, string } = PropTypes;

/**
 * @param {object} params
 * @param {string} params.loginToken
 * @param {string} [params.redirectTo]
 */
export default (params = {}) => {
  const { application, loginToken, redirectTo } = validate(object({
    application: object({
      _id: objectId().required(),
      name: string().required(),
    }),
    loginToken: string().required(),
    redirectTo: string().allow(null),
  }).required(), params);

  let url = `${APP_URL}/authenticate?token=${loginToken}`;
  if (redirectTo) url = `${url}&next=${encodeURIComponent(redirectTo)}`;

  return {
    subject: 'Your personal login link',
    html: `
      <p>You requested to login${application ? ` from ${application.name}` : ''}.</p>
      <p><a href="${url}">Login</a></p>
    `,
    text: `
      You requested to login${application ? ` from ${application.name}` : ''}.
      Link: ${url}
    `,
  };
};
