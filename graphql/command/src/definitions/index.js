import { gql, commandResultDefinitions } from '@parameter1/sso-graphql';

import user from './user.js';

export default gql`

scalar DateTime
scalar ObjectID

directive @auth on FIELD_DEFINITION
directive @interfaceFields on OBJECT

type Query {
  "A simple ping/pong query."
  ping: String!
}

type Mutation {
  "A simple ping/pong mutation."
  ping: String!
}

${commandResultDefinitions}

${user}

`;
