# SSO Database Repositories

## Models

### Applications
Define high-level applications that are available in the P1 ecosystem.

Document objects of this type _cannot_ be created or modified by external users.

**Indexes**
- Unique
  - `key`

Uses versioning: `true`

```js
const application = {
  _id: ObjectId(),
  key: 'mindful-cms',
  name: 'MindfulCMS',
};
```

### Users
Define the users within the P1 ecosystem. Users can manage organizations and be members of application instance workspaces. Users are unique by email and can log-in using a magic login link sent via email. Eventually passwords could be assigned as a secondary authentication method.

**Indexes**
- Unique
  - `email`
- Other
  - `givenName` + `familyName` (sort)
  - `familyName` + `givenName` (sort)

Uses versioning: `true`

```js
const user = {
  _id: ObjectId(),
  email: 'jacob@parameter1.com',
  domain: 'parameter1.com',
  givenName: 'Jacob',
  familyName: 'Bare',
  lastSeenAt: ISODate(),
  lastLoggedInAt: ISODate(),
  verified: true,
  loginCount: 1,
  previousEmails: [],
};
```

### Organizations
Define high-level organizations that exist within the P1 ecosystem. Organizations ultimately use applications via application instances (and workspaces).

Model objects of this type _cannot_ be created or modified by external users.

**Indexes**
- Unique
  - `key`

Uses versioning: `true`

```js
const organization = {
  _id: ObjectId(),
  key: 'acbm',
  name: 'AC Business Media',
};
```

### Managers
Define user-to-organization relationships that signify the organizations that a user can manage. Managers have a specific role that defines what they can manage within their org. Managers - depending on their role - can add/remove/update instance workspace members, can change the roles of other managers, and can invite additional users to manage their orgs. Managers don't have implicit access to instance workspaces and, instead, must either give themself access (if able), have another manager give them access, or receive access from P1.

**Indexes**
- Unique
  - `user._id` + `organization._id`
- Other
  - `organization._id`

Uses versioning: `true`

```js
const manager = {
  _id: ObjectId(),
  organization: { _id: ObjectId() },
  role: 'Owner',
  user: { _id: ObjectId() },
};
```

### Workspaces
Define the instances of an organization applications. All application instances have a `default` workspace. Users must be directly assigned as members of a workspace in order to gain access to the workspace.

Model objects of this type _cannot_ be created or modified by external users.

**Indexes**
- Unique
  - `organization._id` + `application._id` + `key`
  - `application._id`
- Other
  - `slug` (sort)

Uses versioning: `true`

```js
const workspace = {
  _id: ObjectId(),
  application: { _id: ObjectId() },
  organization: { _id: ObjectId() },
  key: 'default', // defaults to being generated off name, but can be changed
  name: 'Default',
  slug: 'default', // always generated off name

  urls: [
    { env: 'production', value: 'https://acbm.omeda.parameter1.com' },
    { env: 'development', value: 'http://omeda-acbm.dev.parameter1.com' },
  ],
};
```

#### Workspace Members (via `user::workspaces`)
Define user-to-workspace relationships that signify the instance workspaces that a user is a member of. Each member of an instance workspace can be assigned specific roles and permissions. Only users that are members of an instance workspace can access the instance.

## Versioning
In addition to the `n`, `date` and `user` fields, the version document also optionally contains `source`, `ua`, and `ip` context fields. Documents that use versioning also have a specific set of indexes added.

**Indexes**
- `_id` + `_version.current.n`
- `_version.initial.date` + `_id` (sort) [acts as created date]
- `_version.current.date` + `_id` (sort) [acts as modified date]
- `_version.current.date` with `expireAfterSeconds: 0` where the document is flagged for deletion

```js
// after create
const doc1 = {
  _id: 1,
  _version: {
    // becomes the created date and user
    initial: { n: 1, date: ISODate('2022-01-01'), user: null },
    // becomes the last modified date and user
    current: { n: 1, date: ISODate('2022-01-01'), user: null },
    history: [],
  },
  name: 'Jacob',
  age: 39,
};

// after update 1
const doc2 = {
  _id: 1,
  _version: {
    initial: { n: 1, date: ISODate('2022-01-01'), user: null },
    current: { n: 2, date: ISODate('2022-01-02'), user: { _id: 5 } },
    history: [
      { n: 1, date: ISODate('2022-01-01'), user: null },
    ],
  },
  name: 'Jake',
  age: 39,
}

// after update 2
const doc3 = {
   _id: 1,
  _version: {
    initial: { n: 1, date: ISODate('2022-01-01'), user: null },
    current: { n: 3, date: ISODate('2022-01-03'), user: { _id: 2 } },
    history: [
      { n: 2, date: ISODate('2022-01-02'), user: { _id: 5 } },
      { n: 1, date: ISODate('2022-01-01'), user: null },
    ],
  },
  name: 'Foo',
  age: 40,
}

// after delete, the doc no longer exists in the main collection

// after restore
const doc4 = {
   _id: 1,
  _version: {
    initial: { n: 1, date: ISODate('2022-01-01'), user: null },
    current: { n: 5, date: ISODate('2022-01-05'), user: { _id: 1 } },
    history: [
      { n: 4, date: ISODate('2022-01-04'), user: { _id: 7 }, deleted: true },
      { n: 3, date: ISODate('2022-01-03'), user: { _id: 2 } },
      { n: 2, date: ISODate('2022-01-02'), user: { _id: 5 } },
      { n: 1, date: ISODate('2022-01-01'), user: null },
    ],
  },
  name: 'Foo',
  age: 40,
}

// corresponding shadow collection
const docs = [
  {
    _id: { _id: 1, n: 1 },
    deleted: false,
    date: ISODate('2022-01-01'),
    user: null,
    doc: {
      name: 'Jacob',
      age: 39,
    },
  },

  {
    _id: { _id: 1, n: 2 },
    deleted: false,
    date: ISODate('2022-01-02'),
    user: { _id: 5 },
    doc: {
      name: 'Jake',
      age: 39,
    },
  },

  {
    _id: { _id: 1, n: 3 },
    deleted: false,
    date: ISODate('2022-01-03'),
    user: { _id: 2 },
    doc: {
      name: 'Foo',
      age: 40,
    },
  },

  {
    _id: { _id: 1, n: 4 },
    deleted: true,
    date: ISODate('2022-01-04'),
    user: { _id: 7 },
    doc: {
      name: 'Foo',
      age: 40,
    },
  },

  {
    _id: { _id: 1, n: 5 },
    deleted: false,
    date: ISODate('2022-01-05'),
    user: { _id: 1 },
    doc: {
      name: 'Foo',
      age: 40,
    },
  },
];
