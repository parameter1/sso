import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns the currently logged-in user. Will return an authentication error if no user is currently logged-in."
  currentUser: User!
    @auth(needsRequiredUserFields: false)
}

extend type Mutation {
  "Logs a user in via a magic login link token."
  loginUserFromLink(input: MutateLoginUserFromLinkInput!): UserAuth!
  "Logs out the currently logged-in user."
  logoutUser: String!
    @auth(needsRequiredUserFields: false)
  "Sends a magic login link to a user. The user must already exist."
  sendUserLoginLink(input: MutateSendUserLoginLinkInput!): String!
}

type User {
  "The unique user identifier"
  id: ObjectID! @project(field: "_id")
  "The user's email address. This value is unique across all users."
  email: String! @project
  "The user's given/first name."
  givenName: String @project(field: "name.given")
  "The user's family/last name."
  familyName: String @project(field: "name.family")
  "The user's full name."
  name: String @project(field: "name.full")
  "Whether the user email address has been verified."
  verified: Boolean! @project
  "The number of times the user has logged in."
  loginCount: Int! @project
  "The ISO date when the user was created."
  createdAt: DateTime! @project(field: "date.created")
  "The ISO date when the user was last updated."
  updatedAt: DateTime! @project(field: "date.updated")
  "The ISO date when the user last logged in."
  lastLoggedInAt: DateTime @project(field: "date.lastLoggedIn")
  "The ISO date when the user was last seen accessing the system."
  lastSeenAt: DateTime @project(field: "date.lastSeen")
}


type UserAuth {
  "The user object."
  user: User!
  "The authentication JWT. Use this value to authenticate requests."
  authToken: String!
  "The ISO date of when this token expires."
  expiresAt: DateTime
}

input MutateLoginUserFromLinkInput {
  "The JWT token provided from the user login link."
  loginLinkToken: String!
}

input MutateSendUserLoginLinkInput {
  "The user email address to send the login to. The user must exist."
  email: String!
  "A location to redirect the user to after successful authentication."
  redirectTo: String
}

`;
