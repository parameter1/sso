import Joi from '@parameter1/joi';

const one = () => {};
const many = () => {};

export default [
  one('application')
    .has().many('tags').with(['name']),

  many('user-events')
    .have().one('user').with(['email']),

  many('organizations')
    .have()
    .many('users')
    .as('managers')
    .with(['email', 'givenName', 'familyName'])
    .affix({ role: Joi.string().valid('Owner', 'Administrator') })
    .inverse('manages')
    .with(['name', 'slug']),

  many('workspaces')
    .have()
    .many('users')
    .as('members')
    .with(['email', 'givenName', 'familyName'])
    .affix({ role: Joi.string() })
    .inverse('memberships')
    .with({ props: ['name', 'slug', 'url'], edges: ['app', 'org'] }),

  many('workspaces')
    .have()
    .one('application')
    .as('app')
    .with(['name', 'slug'])
    .inverse()
    .with({ props: ['name', 'slug'], edges: ['org'] }),

  many('workspaces')
    .have()
    .one('organization')
    .as('org')
    .with(['name', 'slug'])
    .inverse()
    .with({ props: ['name', 'slug'], edges: ['app'] }),
];
