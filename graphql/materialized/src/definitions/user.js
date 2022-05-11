import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns the currently logged-in user. Will return an authentication error if no user is currently logged-in."
  currentUser: User!
    @auth
}

interface UserInterface {
  "The unique user identifier"
  _id: ObjectID! @project
  "Dates associated with this user, such as first created and last touched."
  date: UserDate! @project(field: "_date", deep: true) @object
  "The user's current email address, domain, and any previously used addresses."
  email: UserEmail! @project(field: "", deep: true) @object
  "The number of times the user has logged in."
  loginCount: Int! @project
  "The user's given, family and full names."
  name: UserName! @project(field: "", deep: true) @object
  "The user slugs."
  slug: UserSlug! @project(deep: true)
  "Whether the user email address has been verified."
  verified: Boolean! @project
}

type UserPartial implements UserInterface @interfaceFields {
  "The owning document."
  _owner: User! @loadOwner(type: USER)
}

type User implements UserInterface @interfaceFields {
  "Related connections."
  _connection: User_Connection! @project(deep: true) @object
  "Related edges."
  _edge: User_Edge! @project(deep: true) @object
}

type User_Connection {
  "The organizations that this user manages."
  organization: User_ConnectionOrganization!
    @project(deep: true)
    @object
    @auth
  "Applications of this user of by way the user's workspace memberships."
  workspaceApplication: User_ConnectionWorkspaceApplication!
    @project(deep: true)
    @object
    @auth
  "Organizations of this user of by way the user's workspace memberships."
  workspaceOrganization: User_ConnectionWorkspaceOrganization!
    @project(deep: true)
    @object
    @auth
}

type User_ConnectionOrganization {
  edges: [User_ConnectionOrganizationEdge!]!
    @project(field: "", deep: true, needs: ["node._deleted"])
    @filterDeleted(field: "node")
    @array
}

type User_ConnectionOrganizationEdge {
  "The user's organization management role."
  role: User_ConnectionOrganizationEdgeRole! @project(field: "", deep: true)
  "The managed organization."
  node: OrganizationPartial! @project(deep: true)
}

type User_ConnectionOrganizationEdgeRole {
  "The role identifier."
  _id: OrganizationManagerRoleEnum! @project(field: "role")
  "The role name."
  name: String! @project(field: "role")
}


type User_ConnectionWorkspaceApplication {
  edges: [User_ConnectionWorkspaceApplicationEdge!]!
    @project(field: "", deep: true, needs: ["node._deleted"])
    @filterDeleted(field: "node")
    @array
}

type User_ConnectionWorkspaceApplicationEdge {
  node: ApplicationPartial! @project(deep: true)
}

type User_ConnectionWorkspaceOrganization {
  edges: [User_ConnectionWorkspaceOrganizationEdge!]!
    @project(field: "", deep: true, needs: ["node._deleted"])
    @filterDeleted(field: "node")
    @array
}

type User_ConnectionWorkspaceOrganizationEdge {
  node: OrganizationPartial! @project(deep: true)
}

type User_Edge {
  "The created by edge."
  createdBy: User_EdgeCreatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
  "The updated by edge."
  updatedBy: User_EdgeUpdatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
}

type User_EdgeCreatedBy {
  "The user that first created the user."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

type User_EdgeUpdatedBy {
  "The user that last updated the user."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

type UserDate {
  "The ISO date when the user was created."
  created: DateTime! @project
  "The ISO date when the user last logged in."
  lastLoggedIn: DateTime @project
  "The ISO date when the user was last seen accessing the system."
  lastSeen: DateTime @project
  "The ISO date when the user was last updated."
  updated: DateTime! @project
}

type UserEmail {
  "The user's email address. This value is unique across all users."
  address: String! @project(field: "email")
  "The user's email domain."
  domain: String! @project(field: "domain")
  "Any previously used email addresses."
  previous: [String!]! @project(field: "previousEmails") @array
}

type UserName {
  "The user's family/last name."
  family: String! @project(field: "familyName")
  "An alias for the user's given name."
  first: String! @project(field: "givenName")
  "The user's given/first name."
  given: String! @project(field: "givenName")
  "The user's full name."
  full: String! @project(field: "givenName", needs: ["familyName"])
  "An alias for the user's family name."
  last: String! @project(field: "familyName")
}

type UserSlug {
  "The default user slug, starting with the user's given name."
  default: String! @project
  "The reversed user slug, starting with the user's family name."
  reverse: String! @project
}


`;
