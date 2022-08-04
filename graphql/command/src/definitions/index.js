import { gql } from '@parameter1/graphql/tag';

import user from './user.js';

export default gql`

scalar DateTime
scalar ObjectID

type Query {
  "A simple ping/pong query."
  ping: String!
}

type Mutation {
  "A simple ping/pong mutation."
  ping: String!
}

${user}

`;
