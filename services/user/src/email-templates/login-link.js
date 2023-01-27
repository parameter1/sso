import { PropTypes, validate } from '@parameter1/sso-prop-types-core';
import { APP_URL, SENDING_DOMAIN } from '../env.js';

const { object, objectId, string } = PropTypes;

/**
 * @param {object} params
 * @param {string} params.loginToken
 * @param {string} [params.redirectTo]
 */
export function createLoginLinkTemplate(params) {
  const { application, loginToken, redirectTo } = validate(object({
    application: object({
      _id: objectId().required(),
      name: string().required(),
    }).allow(null),
    loginToken: string().required(),
    redirectTo: string().allow(null),
  }).required(), params);

  let url = `${APP_URL}/authenticate?token=${loginToken}`;
  if (redirectTo) url = `${url}&next=${encodeURIComponent(redirectTo)}`;

  const appName = "Parameter1's SSO portal";
  const supportEmail = 'support@parameter1.com';
  const supportEmailHtml = supportEmail ? ` or <a href="mailto:${supportEmail}">contact our support staff</a>` : '';
  const supportEmailText = supportEmail ? ` or contact our support staff at ${supportEmail}` : '';
  const addressValues = ['Parameter1 LLC', 'PO Box 430', 'Fort Atkinson', 'WI 53538'];

  return {
    subject: 'Your personal login link',
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" id="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=10.0,initial-scale=1.0">
          <title>Your personal login link</title>
        </head>
        <body>
          <p>You recently requested to login${application ? ` <strong>from ${application.name}</strong>` : ''}. This link can be used multiple times to login, but will expire in one hour.</p>
          <p><a href="${url}">Click here to complete your login</a></p>
          <p>If you didn't request this link, simply ignore this email${supportEmailHtml}.</p>
          <hr>
          <small style="font-color: #ccc;">
            <p>Please add <em>${SENDING_DOMAIN}</em> to your address book or safe sender list to ensure you receive future emails from us.</p>
            <p>You are receiving this email because a login request was made on ${appName}.</p>
            <p>For additional information please contact ${addressValues.join(', ')}.</p>
          </small>
        </body>
      </html>
    `,
    text: `
You recently requested to login${application ? ` from ${application.name}` : ''}. This link can be used multiple times to login, but will expire in one hour.

Complete your login by visiting this link:
${url}

If you didn't request this link, simply ignore this email${supportEmailText}.

-------------------------

Please add ${SENDING_DOMAIN} to your address book or safe sender list to ensure you receive future emails from us.
You are receiving this email because a login request was made on ${appName}.
For additional information please contact ${addressValues.join(', ')}.
`,
  };
}
