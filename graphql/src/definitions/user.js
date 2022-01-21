import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Mutation {
  "Sends a magic login link to a user. The user must already exist."
  sendUserLoginLink(input: MutateSendUserLoginLinkInput!): String!
}

type User {
  "The unique user identifier"
  id: ObjectID! @project(field: "_id")
  "The user's email address. This value is unique across all users."
  email: String! @project
}

input MutateSendUserLoginLinkInput {
  "The user email address to send the login to. The user must exist."
  email: String!
  "A location to redirect the user to after successful authentication."
  redirectTo: String
}

`;
