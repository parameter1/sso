import { gql } from '@parameter1/graphql/tag';

export default gql`

type Application {
  "The unique application identifier"
  id: ObjectID! @project(field: "_id")
  "The application name."
  name: String! @project
  "The unique application slug."
  slug: String! @project
  "Any previous slugs that this application used that are now considered redirects."
  redirects: [String!]! @project @array
  "Membership roles that this application supports."
  roles: [String!]! @project @array
  "The ISO date when the application was created."
  createdAt: DateTime! @project(field: "date.created")
  "The ISO date when the application was last updated."
  updatedAt: DateTime! @project(field: "date.updated")
}

`;
