import Joi from '@parameter1/joi';

const many = () => {};

export default [
  many('user-events')
    .have().one('user').including(['email']),

  many('organizations')
    .have()
    .many('users')
    .as('managers')
    .including(['email', 'givenName', 'familyName'])
    .with({ role: Joi.string().valid('Owner', 'Administrator') })
    .inversed()
    .as('manages')
    .including(['name', 'slug']),

  many('workspaces')
    .have()
    .many('users')
    .as('members')
    .including(['email', 'givenName', 'familyName'])
    .with({ role: Joi.string() })
    .inversed()
    .as('memberships')
    .including({ props: ['name', 'slug', 'url'], edges: ['app', 'org'] }),

  many('workspaces')
    .have()
    .one('application')
    .as('app')
    .including(['name', 'slug'])
    .inversed()
    .as('workspaces')
    .including({ props: ['name', 'slug'], edges: ['org'] }),

  many('workspaces')
    .have()
    .one('organization')
    .as('org')
    .including(['name', 'slug'])
    .inveresed()
    .as('workspaces')
    .including({ props: ['name', 'slug'], edges: ['app'] }),
];
