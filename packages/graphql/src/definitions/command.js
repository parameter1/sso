import { gql } from '@parameter1/graphql/tag';

export const commandResultEnums = {
  CommandResultEntityTypeEnum: {
    USER: 'user',
  },
};

export const commandResultDefinitions = gql`

enum CommandResultEntityTypeEnum {
  USER
}

interface CommandResultInterface {
  _id: ObjectID!
  command: String!
  date: DateTime!
  entityType: CommandResultEntityTypeEnum!
  userId: ObjectID
}

type CommandResult implements CommandResultInterface @interfaceFields {
  entityId: ObjectID!
}

`;
