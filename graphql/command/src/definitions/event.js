import { gql } from '@parameter1/graphql/tag';

export default gql`

enum UserCommandEventNameEnum {
  CHANGE_NAME
}

interface CommandEventInterface {
  _id: ObjectID!
  date: DateTime!
  userId: ObjectID
}

type UserCommandEvent implements CommandEventInterface @interfaceFields {
  entityId: ObjectID!
  command: UserCommandEventNameEnum!
}

`;
