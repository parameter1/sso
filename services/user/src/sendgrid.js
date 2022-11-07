import sgMail from '@sendgrid/mail';
import { EMAIL_FROM, EMAIL_REPLY_TO, SENDGRID_API_KEY } from './env.js';

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 *
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.html
 * @param {string} params.text
 */
export const send = ({
  to,
  subject,
  html,
  text,
} = {}) => sgMail.send({
  to,
  from: EMAIL_FROM,
  replyTo: EMAIL_REPLY_TO,
  subject,
  html,
  text,
});

export default sgMail;
