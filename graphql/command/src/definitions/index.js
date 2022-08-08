import { gql } from '@parameter1/graphql/tag';

import event from './event.js';
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

type Subscription {
  currentUserEventProcessed(input: CurrentUserEventProcessedInput! = {}): UserCommandEvent!
    @auth
}

input CurrentUserEventProcessedInput {
  commands: [UserCommandEventNameEnum!]! = []
}

${event}
${user}

`;
