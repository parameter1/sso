import { isEmailBurner } from '@parameter1/email-utils';
import { cleanPath } from '@parameter1/utils';
import {
  PropTypes,
  createSchema,
  entity,
  many,
  one,
} from '@parameter1/sso-model';
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
} = PropTypes;

const common = {
  email: email().lowercase().custom((value, helpers) => {
    if (isEmailBurner(value)) return helpers.error('string.email');
    return value;
  }),
  emailDomain: hostname(),
  name: string().min(2),
  slug: slug().min(2),
};

export default createSchema().entities([
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
]).relationships([
  one('Application')
    .hasMany('Workspaces')
    .with({ props: ['name', 'slug'], edges: ['org'] }),

  /*
  ^^^ the above is the same as (assuming inverse is on both of these)
    many('Workspaces')
      .haveOne('Application')
      .as('app')
      .with(['name', 'slug']),
      .inverse()
      .with({ props: ['name', 'slug'], edges: ['org'] }),
  */

  many('UserEvents').haveOne('User').with(['email']),

  many('Organizations')
    .haveMany('Users')
    .as('managers')
    .with(['email', 'givenName', 'familyName'])
    .props({ role: string().valid('Owner', 'Administrator') }),
  // .inverse('manages')
  // .with(['name', 'slug']),

  many('Workspaces')
    .haveMany('Users')
    .as('members')
    .with(['email', 'givenName', 'familyName'])
    .props({ role: string() }),
  // .inverse('memberships')
  // .with({ props: ['name', 'slug', 'url'], edges: ['app', 'org'] }),

  many('Workspaces')
    .haveOne('Organization')
    .as('org')
    .with(['name', 'slug']),
  // .inverse()
  // .with({ props: ['name', 'slug'], edges: ['app'] }),
]);
