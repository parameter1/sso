# Tenancy and SSO Database Repositories

## Models

### Applications
Define high-level applications that are available in the P1 ecosystem.

Unique key: `slug`

```js
const applications = [
  {
    _id: ObjectId(),
    name: 'Omeda',
    slug: 'omeda',
    date: {
      created: ISODate(),
      updated: ISODate(),
    },
  },

  {
    _id: ObjectId(),
    name: 'AB Projects',
    slug: 'ab-projects',
    date: {
      created: ISODate(),
      updated: ISODate(),
    },
  },
];
```

### Organizations
Define high-level organizations that exist within the P1 ecosystem. Organizations ultimately use applications using application instances.

Unique key: `slug`

```js
const organizations = [
  {
    _id: ObjectId(),
    name: 'AC Business Media',
    slug: 'acbm',
    date: {
      created: ISODate(),
      updated: ISODate(),
    },
  },
  {
    _id: ObjectId(),
    name: 'AB Media',
    slug: 'ab-media',
    date: {
      created: ISODate(),
      updated: ISODate(),
    },
  },
];
```

### Users
Define the users within the P1 ecosystem. Users can manage organizations and be members of application instances. Users are unique by email and can log-in using a magic login link sent via email. Eventually passwords could be assigned as a secondary authentication method.

Unique key: `email`

```js
const users = [
  {
    _id: ObjectId(),
    email: 'jacob@parameter1.com',
    domain: 'parameter1.com',
    name: {
      given: 'Jacob',
      family: 'Bare',
      full: 'Jacob Bare',
    },
    date: {},
  },

  {
    _id: ObjectId(),
    email: 'brandon@parameter1.com',
    domain: 'parameter1.com',
    name: {
      given: 'Brandon',
      family: 'Krigbaum',
      full: 'Brandon Krigbaum',
    },
    date: {},
  },
];
```

### Managers
Define user-to-organization relationships that signify the organizations that a user can manage. Org managers are automatically members of the org's application instance workspaces, and also have the high-level permissions to add, remove and change instance workspace members. Org managers can also invite additional users to manage their orgs.

Unique key: `user._id + org._id`

```js
const managers = [
  {
    _id: ObjectId(),
    role: 'Owner',
    org: { _id: ObjectId(), name: 'AC Business Media', slug: 'acbm' },
    user: { _id: ObjectId(), email: 'jacob@parameter1.com' },
  },
];
```

### Instances
Define organization-to-application relationships that signify the applications that an organization is using within the P1 ecosystem.

Unique key: `org._id + app._id`

```js
const instances = [
  {
    _id: ObjectId(),
    app: { _id: ObjectId(), name: 'Omeda', slug: 'omeda' },
    org: { _id: ObjectId(), name: 'AC Business Media', slug: 'acbm' },
    namespace: 'omeda.acbm',
  },
  {
    _id: ObjectId(),
    app: { _id: ObjectId(), name: 'Omeda', slug: 'omeda' },
    org: { _id: ObjectId(), name: 'AB Media', slug: 'ab-media' },
    namespace: 'ab-media.omeda',
  },
  {
    _id: ObjectId(),
    app: { _id: ObjectId(), name: 'AB Projects', slug: 'ab-projects' },
    org: { _id: ObjectId(), name: 'AB Media', slug: 'ab-media' },
    namespace: 'ab-media.ab-projects',
  },
];
```

### Workspaces
Define the sub-tenants of an organization application instance. All instances have a `default` workspace. Users can be directly assigned as members of a workspace, or indirectly when the user is an organization manager.

Unique key: `instance._id + slug`

```js
const workspaces = [
  {
    _id: ObjectId(),
    instance: {
      _id: ObjectId(),
      app: { _id: ObjectId(), name: 'Omeda', slug: 'omeda' },
      org: { _id: ObjectId(), name: 'AC Business Media', slug: 'acbm' },
      namespace: 'omeda.acbm',
    },
    name: 'Default',
    slug: 'default',
    namespace: 'omeda.acbm.default',
    url: {
      prod: 'https://acbm.omeda.parameter1.com',
      dev: 'http://omeda-acbm.dev.parameter1.com',
    },
  }
];
```


### Members
Define user-to-workspace relationships that signify the instance workspaces that a user is a member of. Each member of an instance workspace can be assigned specific roles and permissions. Only users that are members of an instance workspace (either directly or indirectly as an org manager) can access the instance.

Unique key: `user._id + workspace._id`

```js
const members = [
  {
    _id: ObjectId(),
    workspace: {
      _id: ObjectId(),
      namespace: 'omeda.acbm.default',
      instance: { app: {}, org: {} },
    },
    user: { _id: ObjectId(), email: 'brandon@parameter1.com' },
    role: 'Member',
  }
];
```
