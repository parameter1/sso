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
  "Dates associated with this application, such as first created and last touched."
  date: ApplicationDate! @project(field: "", deep: true) @object
  "The unique application key."
  key: String! @project
  "The application name."
  name: String! @project
  "Membership roles that this application supports."
  roles: [String!]! @project @array
}

type ApplicationDate {
  "The ISO date when the application was created."
  created: DateTime! @project(field: "_touched.first.date")
  "The ISO date when the application was last touched."
  touched: DateTime! @project(field: "_touched.last.date")
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
