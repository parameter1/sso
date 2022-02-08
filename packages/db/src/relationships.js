import Joi from '@parameter1/joi';

const one = () => {};
const many = () => {};

export default [
  one('Application')
    .hasMany('Tags').with(['name']),

  many('UserEvents')
    .haveOne('User').with(['email']),

  many('Organizations')
    .haveMany('Users')
    .as('managers')
    .with(['email', 'givenName', 'familyName'])
    .affix({ role: Joi.string().valid('Owner', 'Administrator') })
    .inverse('manages')
    .with(['name', 'slug']),

  many('Workspaces')
    .haveMany('Users')
    .as('members')
    .with(['email', 'givenName', 'familyName'])
    .affix({ role: Joi.string() })
    .inverse('memberships')
    .with({ props: ['name', 'slug', 'url'], edges: ['app', 'org'] }),

  many('Workspaces')
    .haveOne('Application')
    .as('app')
    .with(['name', 'slug'])
    .inverse()
    .with({ props: ['name', 'slug'], edges: ['org'] }),

  many('Workspaces')
    .haveOne('Organization')
    .as('org')
    .with(['name', 'slug'])
    .inverse()
    .with({ props: ['name', 'slug'], edges: ['app'] }),
];
