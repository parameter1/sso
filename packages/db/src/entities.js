import { isEmailBurner } from '@parameter1/email-utils';
import { cleanPath } from '@parameter1/utils';
import { Schema, entity } from '@parameter1/sso-model';
import environments from './schema/environments.js';

const {
  array,
  boolean,
  date,
  email,
  hostname,
  ipv4,
  object,
  sequence,
  slug,
  string,
  url,
} = Schema;

const common = {
  email: email().lowercase().custom((value, helpers) => {
    if (isEmailBurner(value)) return helpers.error('string.email');
    return value;
  }),
  emailDomain: hostname(),
  name: string().min(2),
  slug: slug().min(2),
};

export default [
  entity('Application').props({
    name: common.name,
    redirects: array().items(common.slug),
    roles: array().items(string()),
    slug: common.slug,
  }),
  entity('Organization').props({
    emailDomains: array().items(common.emailDomain),
    name: common.name,
    redirects: array().items(common.slug),
    slug: common.slug,
  }),
  entity('User').props({
    domain: common.emailDomain,
    email: common.email,
    familyName: string(),
    givenName: string(),
    loginCount: sequence(),
    previousEmails: array().items(common.emailDomain),
    verified: boolean(),
  }),
  entity('UserEvent').props({
    action: string().valid('magic-login', 'send-login-link', 'logout'),
    data: object().unknown(),
    date: date(),
    ip: ipv4(),
    ua: string(),
  }),
  entity('Workspace').props({
    name: common.name,
    redirects: array().items(common.slug),
    slug: common.slug,
    urls: object().keys(environments.reduce((o, env) => ({
      ...o, [env]: url().custom(cleanPath),
    }), {})),
  }),
];
