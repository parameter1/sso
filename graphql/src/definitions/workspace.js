import { gql } from '@parameter1/graphql/tag';

export default gql`

type Workspace {
  "The unique workspace identifier"
  id: ObjectID! @project(field: "_id")
  "The workspace name."
  name: String! @project
  "The unique workspace slug."
  slug: String! @project
  "The workspace URL. Is calaculated based on the current environment."
  url: String @project(field: "urls")
  "Any previous slugs that this workspace used that are now considered redirects."
  redirects: [String!]! @project @array
  "The ISO date when the workspace was created."
  createdAt: DateTime! @project(field: "date.created")
  "The ISO date when the workspace was last updated."
  updatedAt: DateTime! @project(field: "date.updated")
}

`;
