import { gql } from '@parameter1/graphql/tag';

export default gql`

type Organization {
  "The unique organization identifier"
  id: ObjectID! @project(field: "_id")
  "The organization name."
  name: String! @project
  "The unique organization slug."
  slug: String! @project
  "Any previous slugs that this organization used that are now considered redirects."
  redirects: [String!]! @project @array
  "Email domains associated with this organization."
  emailDomains: [String!]! @project @array
  "The ISO date when the organization was created."
  createdAt: DateTime! @project(field: "date.created")
  "The ISO date when the organization was last updated."
  updatedAt: DateTime! @project(field: "date.updated")
}

`;
