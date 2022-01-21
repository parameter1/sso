import { gql } from '@parameter1/graphql/tag';

export default gql`

type Query {
  "A simple ping/pong query."
  ping: String!
}

type Mutation {
  "A simple ping/pong mutation."
  ping: String!
}

`;
