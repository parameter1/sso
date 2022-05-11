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

type EmbeddedUser implements UserInterface @interfaceFields {
  "The unique user identifier"
  _id: ObjectID! @project
  "The owning document."
  _owner: User! @loadOwner(type: USER)
}

type User implements UserInterface @interfaceFields {
  "Related edges."
  _edge: User_Edge! @project(deep: true) @object
}

type User_Edge {
  "The created by edge."
  createdBy: User_EdgeCreatedBy @project(deep: true)
  "The updated by edge."
  updatedBy: User_EdgeUpdatedBy @project(deep: true)
}

type User_EdgeCreatedBy {
  "The user that first created the user."
  node: EmbeddedUser! @project(deep: true)
}

type User_EdgeUpdatedBy {
  "The user that last updated the user."
  node: EmbeddedUser! @project(deep: true)
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
