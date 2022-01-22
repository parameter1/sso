# Tenancy and SSO Database Repositories

## Models

### Applications
Define high-level applications that are available in the P1 ecosystem.

Model objects of this type _cannot_ be created or modified by external users.

Unique key: `slug`

```js
const application = {
  _id: ObjectId(),
  slug: 'omeda',
  name: 'Omeda',
  date: {
    created: ISODate(),
    updated: ISODate(),
  },
};
```

### Users
Define the users within the P1 ecosystem. Users can manage organizations and be members of application instance workspaces. Users are unique by email and can log-in using a magic login link sent via email. Eventually passwords could be assigned as a secondary authentication method.

Unique key: `email`

```js
const users = {
  _id: ObjectId(),
  email: 'jacob@parameter1.com',
  domain: 'parameter1.com',
  name: {
    default: 'Jacob Bare',
    given: 'Jacob',
    family: 'Bare',
  },
  date: {
    created: ISODate(),
    updated: ISODate(),
    lastSeen: ISODate(),
    lastLoggedIn: ISODate(),
  },
  verified: true,
  loginCount: 0,

  // lists all organizations this user manages.
  // see `organization.managers` for more info
  manages: [],

  // lists all workspaces this user is a member of.
  // see `workspace.members` for more info.
  memberships: [],
};
```

### Organizations
Define high-level organizations that exist within the P1 ecosystem. Organizations ultimately use applications via application instances (and workspaces).

Model objects of this type _cannot_ be created or modified by external users.

Unique key: `slug`

```js
const organizations = [
  {
    _id: ObjectId(),
    slug: 'acbm',
    name: 'AC Business Media',
    createdAt: ISODate(),
    updatedAt: ISODate(),

    managers: [
      {
        user: { _id: ObjectId(), email: 'jacob@parameter1.com' },
        role: 'Owner',
        addedAt: now,
      }
    ],
  },
  {
    _id: ObjectId(),
    slug: 'ab-media',
    name: 'AB Media',
    createdAt: ISODate(),
    updatedAt: ISODate(),
  },
];
```

### Organization Managers (via `organization.managers`)
Define user-to-organization relationships that signify the organizations that a user can manage. Managers have a specific role that defines what they can manage within their org. Managers - depending on their role - can add/remove/update instance workspace members, can change the roles of other managers, and can invite additional users to manage their orgs. Managers don't have implicit access to instance workspaces and, instead, must either give themself access (if able), have another manager give them access, or receive access from P1.

### Workspaces
Define the instances of an organization applications. All application instances have a `default` workspace. Users must be directly assigned as members of a workspace in order to gain access to the workspace.

Model objects of this type _cannot_ be created or modified by external users.

Unique key: `org._id, app._id + slug`

```js
const workspaces = [
  {
    _id: ObjectId(),
    app: { _id: ObjectId(), slug: 'omeda' },
    org: { _id: ObjectId(), slug: 'acbm' },
    namespace: 'omeda.acbm',
    slug: 'default',

    name: 'Default',
    urls: [
      { env: 'production', value: 'https://acbm.omeda.parameter1.com' },
      { env: 'development', value: 'http://omeda-acbm.dev.parameter1.com' },
    ],

    members: [
      {
        user: { _id: ObjectId(), email: 'jacob@parameter1.com' },
        role: 'Admin',
        addedAt: ISODate(),
      },
    ],

    createdAt: ISODate(),
    updatedAt: ISODate(),
  }
];
```

#### Workspace Members (via `workspace.members`)
Define user-to-workspace relationships that signify the instance workspaces that a user is a member of. Each member of an instance workspace can be assigned specific roles and permissions. Only users that are members of an instance workspace can access the instance.
