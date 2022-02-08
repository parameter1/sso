import Joi from '@parameter1/joi';
import { isEmailBurner } from '@parameter1/email-utils';
import { cleanPath } from '@parameter1/utils';
import { entity } from '@parameter1/sso-model';
import environments from './schema/environments.js';

const common = {
  email: Joi.email().lowercase().custom((value, helpers) => {
    if (isEmailBurner(value)) return helpers.error('string.email');
    return value;
  }),
  emailDomain: Joi.hostname(),
  name: Joi.string().min(2),
  slug: Joi.slug().min(2),
  ipv4: Joi.string().ip({ version: ['ipv4'], cidr: 'forbidden' }),
};

export default [
  entity('Application').props([
    { name: 'name', schema: common.name },
    { name: 'redirects', schema: Joi.array().items(common.slug) },
    { name: 'roles', schema: Joi.array().items(Joi.string()) },
    { name: 'slug', schema: common.slug },
  ]),
  entity('Organization').props([
    { name: 'emailDomains', schema: Joi.array().items(common.emailDomain) },
    { name: 'name', schema: common.name },
    { name: 'redirects', schema: Joi.array().items(common.slug) },
    { name: 'slug', schema: common.slug },
  ]),
  entity('User').props([
    { name: 'domain', schema: common.emailDomain },
    { name: 'email', schema: common.email },
    { name: 'familyName', schema: Joi.string() },
    { name: 'givenName', schema: Joi.string() },
    { name: 'loginCount', schema: Joi.sequence() },
    { name: 'previousEmails', schema: Joi.array().items(common.emailDomain) },
    { name: 'verified', schema: Joi.boolean() },
  ]),
  entity('UserEvent').props([
    { name: 'action', schema: Joi.string().valid('magic-login', 'send-login-link', 'logout') },
    { name: 'data', schema: Joi.object().unknown() },
    { name: 'date', schema: Joi.date() },
    { name: 'ip', schema: common.ipv4 },
    { name: 'ua', schema: Joi.string() },
  ]),
  entity('Workspace').props([
    { name: 'name', schema: common.name },
    { name: 'redirects', schema: Joi.array().items(common.slug) },
    { name: 'slug', schema: common.slug },
    {
      name: 'urls',
      schema: environments.reduce((o, env) => ({
        ...o, [env]: Joi.url().custom(cleanPath),
      }), {}),
    },
  ]),
];
