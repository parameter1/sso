import { gql } from '@parameter1/graphql/tag';

export default gql`

enum UserEventCommandEnum {
  CHANGE_NAME
}

interface CommandEventInterface {
  _id: ObjectID!
  userId: ObjectID
}

type UserCommandEvent implements CommandEventInterface @interfaceFields {
  entityId: ObjectID!
  command: UserEventCommandEnum!
}

`;
