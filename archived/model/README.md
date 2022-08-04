## Relationships

### Many-To-One (N:1)
- _many_ `Workspaces` have _one_ `Organization`
- _many_ `OwningDocuments` have _one_ `ForeignDocument`

Each `Workspace`:
- can only have _one_ `Organization`
- an individual `Organization` can appear on _many_ other `Workspaces`

Each `OwningDocument`
- can only have _one_ `ForeignDocument`
- and individual `ForeignDocument` can appear on _many_ other `OwningDocuments`

#### Indexing
The field on the `OwningDocument` should be indexed
- `workspaces::_edge.organization.node._id`
- `owners::_edge[foreign].node._id`

#### Denormalized Value Updates
When values on the `ForeignDocument` change, _many_ `OwningDocuments` must also be updated where the `_id` values match.
- when `organization._id = 1` changes, update workspaces where `_edge.organization.node._id = 1`
- this would use an `updateMany` operation

#### Inversion
When inversed the relationship becomes One-To-Many (1:N)
- _one_ `Organization` has _many_ `Workspaces`

### Examples
```js
// non-unique index on `_edge.organization.node._id`
const workspaces = [
  {
    _id: 1,
    _edge: { organization: { node: _id: 1, name: 'Org A' } }
  },
  {
    _id: 2,
    _edge: { organization: { node: _id: 1, name: 'Org A' } }
  },
  {
    _id: 3,
    _edge: { organization: { node: _id: 2: name: 'Org B' } }
  },
];

// a name change to Org A would result in the following update (condensed)
const op = {
  updateMany: {
    filter: { 'organization.node._id': 1 },
    update: { $set: { name: 'New Org A' } },
  },
};
```

## One-To-Many (1:N)
- _one_ `Organization` has _many_ `Workspaces`
- _one_ `OwningDocument` has _many_ `ForeignDocuments`

Each `Organization`:
- can have _many_ `Workspaces`
- an individual `Workspace` can only appear on _one_ `Organization`

Each `OwningDocument`:
- can have _many_ `ForeignDocuments`
- an individual `ForeignDocument` can only appear on _one_ `OwningDocument`

#### Indexing
The field on the `OwningDocument` should be _uniquely_ indexed with _sparse_ set to true
- `organizations::_connection.workspace.edges.node._id`
- `owners::_connection[foreign].edges.node._id`

#### Denormalized Value Updates
When values on the `ForeignDocument` change, _many_ `OwningDocuments` must also be updated where the `_id` values match.
- when `workspace._id = 1` changes, update workspaces where `_connection.workspace.edges.node._id = 1`
- this would use an `updateMany` operation

#### Inversion
When inversed the relationship becomes Many-To-One (N:1)
- _many_ `Workspaces` have _one_ `Organization`

```js
// sparse unique index on `_connection.workspace.edges.node._id`
const organizations = [
  _id: 1,
  _connection: {
    workspace: {
      edges: [
        { node: { _id: 1, name: 'Workspace A' } },
        { node: { _id: 2, name: 'Workspace B' } },
      ],
    },
  },
  _id: 2,
  _connection: {
    workspace: {
      edges: [
        { node: { _id: 3, name: 'Workspace C' } },
      ],
    },
  },
];

// a name change to Workspace A would result in the following update (condensed)
const op = {
  updateMany: {
    filter: { '_connection.workspace.edges.node._id': 1 },
    update: { $set: { 'elem.name': 'Workspace A' } },
    arrayFilters: [{}]
  },
};
```
