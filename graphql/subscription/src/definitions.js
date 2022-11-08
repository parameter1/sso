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
  result: CommandResult!
}

input CurrentUserCommandProcessed {
  _ids: [ObjectID!]! = []
  for: [CommandProcessedForInput!]! = []
}

input CommandProcessedForInput {
  entityType: CommandResultEntityTypeEnum!
  commands: [String!]! = []
  entityIds: [ObjectID!]! = []
}

${commandResultDefinitions}

`;
