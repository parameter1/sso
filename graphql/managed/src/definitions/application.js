import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns a single application by ID."
  applicationById(input: QueryApplicationByIdInput!): Application
  "Returns a single application by key."
  applicationByKey(input: QueryApplicationByKeyInput!): Application
}

type Application {
  "The unique application identifier"
  _id: ObjectID! @project
  "The unique application key."
  key: String! @project
  "The application name."
  name: String! @project
  "Membership roles that this application supports."
  roles: [String!]! @project @array
}

input QueryApplicationByIdInput {
  "The application ID to return."
  _id: ObjectID!
  "When in strict mode (default), an error will be throw when the application is not found."
  strict: Boolean! = true
}

input QueryApplicationByKeyInput {
  "The application key to return."
  key: String!
  "When in strict mode (default), an error will be throw when the application is not found."
  strict: Boolean! = true
}

`;
