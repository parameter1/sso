import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Mutation {
  "Sends a magic login link to a user's email address. The user must already exist."
  sendUserLoginLink(input: SendUserLoginLinkInput!): String!
}

input SendUserLoginLinkInput {
  "The user email address to send the login to. The user must exist."
  email: String!
  "A location to redirect the user to after successful authentication."
  redirectTo: String
}

`;
