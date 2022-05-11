import { gql } from '@parameter1/graphql/tag';

export default gql`

type Organization {
  "The unique organization identifier"
  _id: ObjectID! @project
  "Dates associated with this organization, such as first created and last touched."
  date: OrganizationDate! @project(field: "", deep: true) @object
  "Email domains associated with this organization."
  emailDomains: [String!]! @project @array
  "The unique organization key."
  key: String! @project
  "The organization name."
  name: String! @project
}

type OrganizationDate {
  "The ISO date when the organization was created."
  created: DateTime! @project(field: "_touched.first.date")
  "The ISO date when the organization was last touched."
  touched: DateTime! @project(field: "_touched.last.date")
}

`;
