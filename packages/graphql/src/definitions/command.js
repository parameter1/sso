import { gql } from 'graphql-tag';

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
  entityType: CommandResultEntityTypeEnum!
  userId: ObjectID
}

type CommandResult implements CommandResultInterface @interfaceFields {
  entityId: ObjectID!
}

`;
