import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns the currently logged-in user. Will return an authentication error if no user is currently logged-in."
  currentUser: User!
    @auth
}

extend type Mutation {
  "Logs a user in via a magic login link token."
  loginUserFromLink(input: MutateLoginUserFromLinkInput!): UserAuth!
  "Logs out the currently logged-in user."
  logoutUser: String!
    @auth
  "Updates the current user's basic profile details."
  ownUserProfile(input: MutateOwnUserProfileInput!): User!
    @auth
  "Sends a magic login link to a user. The user must already exist."
  sendUserLoginLink(input: MutateSendUserLoginLinkInput!): String!
}

type User {
  "The unique user identifier"
  _id: ObjectID! @project
  "Dates associated with this user, such as first created and last touched."
  date: UserDate! @project(field: "", deep: true) @object
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


type UserAuth {
  "The user object."
  user: User!
  "The authentication JWT. Use this value to authenticate requests."
  authToken: String!
  "The ISO date of when this token expires."
  expiresAt: DateTime!
}

type UserDate {
  "The ISO date when the user was created."
  created: DateTime! @project(field: "_touched.first.date")
  "The ISO date when the user was last touched."
  touched: DateTime! @project(field: "_touched.last.date")
  "The ISO date when the user last logged in."
  lastLoggedIn: DateTime @project(field: "lastLoggedInAt")
  "The ISO date when the user was last seen accessing the system."
  lastSeen: DateTime @project(field: "lastSeenAt")
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

input MutateLoginUserFromLinkInput {
  "The JWT token provided from the user login link."
  loginLinkToken: String!
}

input MutateOwnUserProfileInput {
  "The current user's given/first name."
  givenName: String!
  "The current user's family/last name."
  familyName: String!
}

input MutateSendUserLoginLinkInput {
  "An optional application key that signifies the application source where the login attempt is being made."
  applicationKey: String
  "The user email address to send the login to. The user must exist."
  email: String!
  "A location to redirect the user to after successful authentication."
  redirectTo: String
}

input UserWorkspaceRoleInput {
  "The workspace ID to get the user role for."
  id: ObjectID!
}

`;
