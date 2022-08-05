import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns the currently logged-in user. Will return an authentication error if no user is currently logged-in."
  currentUser: User!
    @auth
}

interface UserInterface {
  "The unique user identifier"
  _id: ObjectID!
    @project
  "Metadata containing the created, modified, and touched info."
  _meta: DocumentMeta!
    @project(deep: true)
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

type User implements UserInterface @interfaceFields {
  _id: ObjectID! @project
}

`;
