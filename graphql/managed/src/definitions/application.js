import { gql } from '@parameter1/graphql/tag';

export default gql`

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

`;
