import { gql } from '@parameter1/graphql/tag';

import application from './application.js';
import organization from './organization.js';
import user from './user.js';

export default gql`

scalar DateTime
scalar ObjectID

directive @auth on FIELD_DEFINITION
directive @array(field: String) on FIELD_DEFINITION
directive @project(field: String, needs: [String!]! = []) on FIELD_DEFINITION

type Query {
  "A simple ping/pong query."
  ping: String!
}

type Mutation {
  "A simple ping/pong mutation."
  ping: String!
}

${application}
${organization}
${user}

`;
