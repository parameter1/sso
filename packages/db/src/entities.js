import Joi from '@parameter1/joi';
import { isEmailBurner } from '@parameter1/email-utils';
import { cleanPath } from '@parameter1/utils';
import environments from './schema/environments.js';

const common = {
  email: Joi.email().lowercase().custom((value, helpers) => {
    if (isEmailBurner(value)) return helpers.error('string.email');
    return value;
  }),
  emailDomain: Joi.hostname(),
  name: Joi.string().min(2),
  slug: Joi.slug().min(2),
};

export default {
  application: {
    props: {
      name: common.name,
      redirects: Joi.array().items(common.slug),
      roles: Joi.array().items(Joi.string()),
      slug: common.slug,
    },
  },

  organization: {
    props: {
      emailDomains: Joi.array().items(common.emailDomain),
      name: common.name,
      redirects: Joi.array().items(common.slug),
      slug: common.slug,
    },
  },

  user: {
    props: {
      domain: common.emailDomain,
      email: common.email,
      familyName: Joi.string(),
      givenName: Joi.string(),
      loginCount: Joi.sequence(),
      previousEmails: Joi.array().items(common.emailDomain),
      verified: Joi.boolean(),
    },
  },

  'user-event': {
    props: {
      action: Joi.string().valid('magic-login', 'send-login-link', 'logout'),
      data: Joi.object().unknown(),
      date: Joi.date(),
      ip: Joi.string().ip({ version: ['ipv4'], cidr: 'forbidden' }),
      ua: Joi.string(),
    },
  },

  workspace: {
    props: {
      name: common.name,
      redirects: Joi.array().items(common.slug),
      slug: common.slug,
      urls: environments.reduce((o, env) => ({
        ...o, [env]: Joi.url().custom(cleanPath),
      }), {}),
    },
  },
};
