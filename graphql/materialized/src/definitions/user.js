import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns the currently logged-in user. Will return an authentication error if no user is currently logged-in."
  currentUser: User!
    @auth
}

enum UserOrganizationConnectionSortFieldEnum {
   "Sort by the organization's slug."
   NODE_SLUG
}

enum UserWorkspaceConnectionSortFieldEnum {
  "Sort by the workspaces's path that includes the app slug, org slug, and workspace slug."
  NODE_PATH
}

enum UserWorkspaceOrganizationConnectionSortFieldEnum {
  "Sort by the workspace organization's slug."
  NODE_SLUG
}

interface UserInterface {
  "The unique user identifier"
  _id: ObjectID!
    @project
  "Dates associated with this user, such as first created and last touched."
  date: UserInterfaceDate!
    @project(field: "_date", deep: true) @object
  "The user's current email address, domain, and any previously used addresses."
  email: UserInterfaceEmail!
    @project(field: "", deep: true) @object
  "The number of times the user has logged in."
  loginCount: Int!
    @project
  "The user's given, family and full names."
  name: UserInterfaceName!
    @project(field: "", deep: true) @object
  "The user slugs."
  slug: UserInterfaceSlug!
    @project(deep: true)
  "Whether the user email address has been verified."
  verified: Boolean!
    @project
}

type UserInterfaceDate {
  "The ISO date when the user last logged in."
  lastLoggedIn: DateTime
    @project
  "The ISO date when the user was last seen accessing the system."
  lastSeen: DateTime
    @project
}

type UserInterfaceEmail {
  "The user's email address. This value is unique across all users."
  address: String!
    @project(field: "email")
  "The user's email domain."
  domain: String!
    @project(field: "domain")
  "Any previously used email addresses."
  previous: [String!]!
    @project(field: "previousEmails") @array
}

type UserInterfaceName {
  "The user's family/last name."
  family: String!
    @project(field: "familyName")
  "An alias for the user's given name."
  first: String!
    @project(field: "givenName")
  "The user's given/first name."
  given: String!
    @project(field: "givenName")
  "The user's full name."
  full: String!
    @project(field: "givenName", needs: ["familyName"])
  "An alias for the user's family name."
  last: String!
    @project(field: "familyName")
}

type UserInterfaceSlug {
  "The default user slug, starting with the user's given name."
  default: String!
    @project
  "The reversed user slug, starting with the user's family name."
  reverse: String!
    @project
}

type PartialUser implements UserInterface @interfaceFields {
  "The owning document."
  _owner: User! @loadOwner(type: USER)
}

type User implements UserInterface @interfaceFields {
  "The organizations that this user manages."
  organizationConnection(input: UserOrganizationConnectionInput! = {}): UserOrganizationConnection!
    @project(
      deep: true
      field: "_connection.organization"
      prefixNeedsWith: "_connection.organization.edges.node"
      needs: [
        # core
        "_id",
        # sorting
        "slug",
      ]
    )
    @object
    @auth
  "The workspaces that this user is a member of."
  workspaceConnection(input: UserWorkspaceConnectionInput! = {}): UserWorkspaceConnection!
    @project(
      deep: true
      field: "_connection.workspace"
      prefixNeedsWith: "_connection.workspace.edges.node"
      needs: [
        # core
        "_id"
        # sorting
        "path"
        # filtering
        "key"
        "namespace.default"
        "_edge.application.node._id"
        "_edge.application.node.key"
        "_edge.organization.node._id"
        "_edge.organization.node.key"
      ]
    )
    @object
    @auth
  workspaceOrganizationConnection(input: UserWorkspaceOrganizationConnectionInput! = {}): UserWorkspaceOrganizationConnection!
    @project(
      field: "_connection.workspace"
      deep: true
      prefixNeedsWith: "_connection.workspace.edges.node"
      needs: [
        # core
        "_id"
        "_edge.organization.node._id"
        # sorting
        "_edge.organization.node.slug"
        # filtering
        "_edge.application.node._id"
        "_edge.application.node.key"
      ]
    )
    @object
    @auth
  "Gets the user membership role for the provided workspace ID. Will return null if the user is not a member of the workspace."
  workspaceRoleFromId(input: UserWorkspaceRoleFromIdInput!): String
    @project(
      field: "_connection.workspace.edges.node._id"
      prefixNeedsWith: "_connection.workspace.edges"
      needs: [
        "role"
      ]
    )
}

type UserOrganizationConnection {
  edges: [UserOrganizationConnectionEdge!]!
    @project(deep: true, resolve: false)
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserOrganizationConnectionEdge {
  "The user's organization management role."
  role: UserOrganizationConnectionEdgeRole!
    @project(field: "", deep: true)
  "The managed organization."
  node: PartialOrganization!
    @project(deep: true)
}

type UserOrganizationConnectionEdgeRole {
  "The role identifier."
  _id: OrganizationManagerRoleEnum!
    @project(field: "role")
  "The role name."
  name: String!
    @project(field: "role")
}

type UserWorkspaceConnection {
  edges: [UserWorkspaceConnectionEdge!]!
    @project(deep: true resolve: false)
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserWorkspaceConnectionEdge {
  cursor: String!
  "The user's workspace membership role."
  role: UserWorkspaceConnectionEdgeRole!
    @project(field: "", deep: true)
  "The workspace the user is a member of."
  node: PartialWorkspace!
    @project(deep: true)
}

type UserWorkspaceConnectionEdgeRole {
  "The role identifier."
  _id: String!
    @project(field: "role")
  "The role name."
  name: String!
    @project(field: "role")
}

type UserWorkspaceOrganizationConnection {
  edges: [UserWorkspaceOrganizationConnectionEdge!]!
    @project(deep: true, resolve: false)
    @array
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserWorkspaceOrganizationConnectionEdge {
  node: PartialOrganization!
    @project(
      field: "node._edge.organization.node"
      resolve: false
      deep: true
    )
}

input UserOrganizationConnectionInput {
  "Paginates the results."
  pagination: PaginationInput! = {}
  "Sorts the results by one or more sort fields."
  sort: [UserOrganizationConnectionSortInput!]! = [{}]
}

input UserOrganizationConnectionSortInput {
  field: UserOrganizationConnectionSortFieldEnum! = NODE_SLUG
  order: SortOrderEnum! = ASC
}

input UserWorkspaceConnectionInput {
  "Filters the user workspaces by one or more application IDs. An empty value (default) will return all workspaces."
  applicationIds: [ObjectID!]! = []
  "Filters the user workspaces by one or more application keys. An empty value (default) will return all workspaces."
  applicationKeys: [String!]! = []
  "Filters the user workspaces by one or more workspace keys. An empty value (default) will return all workspaces."
  keys: [String!]! = []
  "Filters the user workspaces by one or more workspace namespaces. An empty value (default) will return all workspaces."
  namespaces: [String!]! = []
  "Filters the user workspaces by one or more organization IDs. An empty value (default) will return all workspaces."
  organizationIds: [ObjectID!]! = []
  "Filters the user workspaces by one or more organization keys. An empty value (default) will return all workspaces."
  organizationKeys: [String!]! = []
  "Paginates the results."
  pagination: PaginationInput! = {}
  "Sorts the results by one or more sort fields."
  sort: [UserWorkspaceConnectionSortInput!]! = [{}]
}

input UserWorkspaceConnectionSortInput {
  field: UserWorkspaceConnectionSortFieldEnum! = NODE_PATH
  order: SortOrderEnum! = ASC
}

input UserWorkspaceOrganizationConnectionInput {
  "Filters the user workspace orgs by one or more application IDs. An empty value (default) will return all workspaces."
  applicationIds: [ObjectID!]! = []
  "Filters the user workspace orgs by one or more application keys. An empty value (default) will return all workspaces."
  applicationKeys: [String!]! = []
  "Paginates the results."
  pagination: PaginationInput! = {}
  sort: [UserWorkspaceOrganizationConnectionSortInput!]! = [{}]
}

input UserWorkspaceOrganizationConnectionSortInput {
  field: UserWorkspaceOrganizationConnectionSortFieldEnum! = NODE_SLUG
  order: SortOrderEnum! = ASC
}

input UserWorkspaceRoleFromIdInput {
  "The workspace ID to return the role from."
  _id: ObjectID!
}

`;
