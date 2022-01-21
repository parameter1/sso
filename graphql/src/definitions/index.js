import { gql } from '@parameter1/graphql/tag';

export default gql`

scalar DateTime
scalar ObjectID

directive @project(field: String, needs: [String!]! = []) on FIELD_DEFINITION

type Query {
  "A simple ping/pong query."
  ping: String!
}

type Mutation {
  "A simple ping/pong mutation."
  ping: String!
}

`;
