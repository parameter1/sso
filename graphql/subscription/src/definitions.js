import { gql, commandResultDefinitions } from '@parameter1/sso-graphql';

export default gql`

scalar DateTime
scalar ObjectID

directive @auth on FIELD_DEFINITION
directive @interfaceFields on OBJECT

type Mutation {
  "A simple ping/pong mutation."
  ping: String!
}

type Query {
  "A simple ping/pong query."
  ping: String!
}

type Subscription {
  currentUserCommandProcessed(input: CurrentUserCommandProcessed! = {}): CommandProcessingResult!
    @auth
}

type CommandProcessingResult {
  _id: ObjectID!
  ok: Boolean!
  result: CommandResult!
}

input CurrentUserCommandProcessed {
  _id: [ObjectID!]! = []
  command: [String!]! = []
}

${commandResultDefinitions}

`;
