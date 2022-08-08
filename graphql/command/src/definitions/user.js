import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Mutation {
  "Logs a user in via a magic login link token."
  loginUserFromLink(input: LoginUserFromLinkInput!): MagicLoginAuthToken!
  "Logs out the currently logged-in user."
  logoutMagicUser: String!
    @auth
  "Changes the currently logged-in user's given and family names"
  ownUserNames(input: OwnUserNamesInput!): UserCommandEvent!
    @auth
  "Sends a magic login link to a user's email address. The user must already exist."
  sendUserLoginLink(input: SendUserLoginLinkInput!): String!
}

type MagicLoginAuthToken {
  "The ISO date of when this token expires."
  expiresAt: DateTime!
  "The authenticated user ID."
  userId: ObjectID!
  "The authentication JWT. Use this value to authenticate requests."
  value: String!
}

input LoginUserFromLinkInput {
  "The JWT token provided from the user login link."
  loginLinkToken: String!
}

input OwnUserNamesInput {
  "The current user's family/last name."
  family: String!
  "The current user's given/first name."
  given: String!
}

input SendUserLoginLinkInput {
  "The user email address to send the login to. The user must exist."
  email: String!
  "A location to redirect the user to after successful authentication."
  redirectTo: String
}

`;
