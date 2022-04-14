# SSO Database Repositories

## Models

### Applications
Define high-level applications that are available in the P1 ecosystem.

Document objects of this type _cannot_ be created or modified by external users.

**Indexes**
- Unique
  - `key`

**Mixins**
- versioning
- soft delete

```js
const application = {
  _id: ObjectId(),
  _deleted: false,
  _touched: {},
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
  - `organizations._id` + `_id`
  - `workspaces._id` + `_id`
  - `slug.default` (sort)
  - `slug.reverse` (sort)

**Mixins**
- versioning
- soft delete

```js
const user = {
  _id: ObjectId(),
  _deleted: false,
  _touched: {},
  email: 'jacob@parameter1.com',
  domain: 'parameter1.com',
  givenName: 'Jacob',
  familyName: 'Bare',
  lastSeenAt: ISODate(),
  lastLoggedInAt: ISODate(),
  verified: true,
  loginCount: 1,
  previousEmails: [],

  organizations: [
    { _id: ObjectId(), role: 'Owner' },
  ],

  slug: { default: 'jacob-bare', reverse: 'bare-jacob' },

  workspaces: [
    { _id: ObjectId(), role: 'Member' },
  ],
};
```

### Organizations
Define high-level organizations that exist within the P1 ecosystem. Organizations ultimately use applications via application instances (and workspaces).

Model objects of this type _cannot_ be created or modified by external users.

**Indexes**
- Unique
  - `key`

**Mixins**
- versioning
- soft delete

```js
const organization = {
  _id: ObjectId(),
  _deleted: false,
  _touched: {},
  key: 'acbm',
  name: 'AC Business Media',
};
```

### Managers (via `user::organizations`)
Define user-to-organization relationships that signify the organizations that a user can manage. Managers have a specific role that defines what they can manage within their org. Managers - depending on their role - can add/remove/update instance workspace members, can change the roles of other managers, and can invite additional users to manage their orgs. Managers don't have implicit access to instance workspaces and, instead, must either give themself access (if able), have another manager give them access, or receive access from P1.

### Workspaces
Define the instances of an organization applications. All application instances have a `default` workspace. Users must be directly assigned as members of a workspace in order to gain access to the workspace.

Model objects of this type _cannot_ be created or modified by external users.

**Indexes**
- Unique
  - `organization._id` + `application._id` + `key`
- Other
  - `application._id`

**Mixins**
- versioning
- soft delete

```js
const workspace = {
  _id: ObjectId(),
  _deleted: false,
  _touched: {},
  application: { _id: ObjectId() },
  organization: { _id: ObjectId() },
  key: 'default',
  name: 'Default',
  urls: [
    { env: 'production', value: 'https://acbm.omeda.parameter1.com' },
    { env: 'development', value: 'http://omeda-acbm.dev.parameter1.com' },
  ],
};
```

#### Workspace Members (via `user::workspaces`)
Define user-to-workspace relationships that signify the instance workspaces that a user is a member of. Each member of an instance workspace can be assigned specific roles and permissions. Only users that are members of an instance workspace can access the instance.

## Soft Delete
When enabled, deleted items will have the `_deleted` field set to `true`, and all unique indexes and queries will account for this value in order to exclude deleted items.

**Indexes**
- none directly, however `_deleted: false` is added as a `partialFilterExpression` to all existing collection indexes

## Versioning / Touched Info
Adds a `_touched` object that records how many times the document has been touched. While a best effort is made to only change these values when document fields _actually_ change, the values of the `_touched` object may signify an update that didn't change any other field values. Ultimately, an additional `_version` field must also be implemented that uses change streams to accurately reflect versions.

The `_touched` object contains an `n` field that is incremented each time the main document is touched. In addition, the `_touched` object also has the `first` and `last` subdocuments containing the `date` and, optionally, the `ip`, `source`, `ua` and `user` that first or last touched the master doc.

**Indexes**
- `_touched.first.date` + `_id` (sort) [acts as quasi created date]
- `_touched.last.date` + `_id` (sort) [acts as quasi modified date]

```js
// after create
const doc1 = {
  _id: 1,
  _deleted: false,
  _touched: {
    n: 1,
    // becomes the created date and user
    first: { date: ISODate('2022-01-01'), user: null },
    // becomes the last modified date and user
    last: { date: ISODate('2022-01-01'), user: null },
  },
  name: 'Jacob',
  age: 39,
};

// after update 1
const doc2 = {
  _id: 1,
  _deleted: false,
  _touched: {
    n: 2,
    first: { date: ISODate('2022-01-01'), user: null },
    last: { date: ISODate('2022-01-02'), user: { _id: 5 } },
  },
  name: 'Jake',
  age: 39,
}

// after update 2
const doc3 = {
  _id: 1,
  _deleted: false,
  _touched: {
    n: 3,
    first: { date: ISODate('2022-01-01'), user: null },
    last: { date: ISODate('2022-01-03'), user: { _id: 2 } },
  },
  name: 'Foo',
  age: 40,
}

const doc4 = {
  _id: 1,
  _deleted: true,
  _touched: {
    n: 4,
    first: { date: ISODate('2022-01-01'), user: null },
    last: { date: ISODate('2022-01-05'), user: { _id: 1 } },
  },
  name: 'Foo',
  age: 40,
}
```
