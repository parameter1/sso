import { gql } from '@parameter1/graphql/tag';

export default gql`

type Workspace {
  "The unique workspace identifier"
  id: ObjectID! @project(field: "_id")
  "The workspace name."
  name: String! @project
  "The workspace namespace."
  namespace: String! @project(field: "slug", needs: ["app.slug", "org.slug"])
  "The workspace full name, including the app and org names."
  fullName: String! @project(field: "name", needs: ["app.name", "org.name"])
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
  "The application that this workspace uses."
  applicationEdge: WorkspaceApplicationEdge! @project(field: "app")
  "The organization that owns this workspace."
  organizationEdge: WorkspaceOrganizationEdge! @project(field: "org")
}

type WorkspaceApplicationEdge {
  "The workspace application node."
  node: Application!
}

type WorkspaceOrganizationEdge {
  "The workspace organization node."
  node: Organization!
}

`;
