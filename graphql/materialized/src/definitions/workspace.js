import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns a single workspace by full namespace."
  workspaceByNamespace(input: QueryWorkspaceByNamespaceInput!): Workspace
}

interface WorkspaceInterface {
  "The unique workspace identifier"
  _id: ObjectID!
    @project
  "The workspace key."
  key: String!
    @project
  "The workspace name."
  name: String!
    @project
  "The workspace namespaces."
  namespace: WorkspaceInterfaceNamespace!
    @project(deep: true)
    @object
  "The workspace path."
  path: String!
    @project
  "The workspace slug."
  slug: String!
    @project
}

type WorkspaceInterfaceNamespace {
  "The full, default and unique workspace namespace."
  default: String!
    @project
  "The namespace when used inside an application."
  application: String!
    @project
}

type PartialWorkspace implements WorkspaceInterface @interfaceFields {
  "The owning document."
  _owner: Workspace!
    @loadOwner(type: WORKSPACE)
  "The workspace application."
  applicationEdge: PartialWorkspaceApplicationEdge!
    @project(deep: true, field: "_edge.application")
  "The workspace organization."
  organizationEdge: PartialWorkspaceOrganizationEdge!
    @project(deep: true, field: "_edge.organization")
}

type PartialWorkspaceApplicationEdge {
  "The partial application."
  node: PartialApplication!
    @project(deep: true)
}

type PartialWorkspaceOrganizationEdge {
  "The partial organization."
  node: PartialOrganization!
    @project(deep: true)
}

type Workspace implements WorkspaceInterface @interfaceFields {
  "The workspace application."
  applicationEdge: WorkspaceApplicationEdge!
    @project(deep: true, field: "_edge.application")
  "The workspace organization."
  organizationEdge: WorkspaceOrganizationEdge!
    @project(deep: true, field: "_edge.organization")
}

type WorkspaceApplicationEdge {
  "The partial application."
  node: PartialApplication!
    @project(deep: true)
}

type WorkspaceOrganizationEdge {
  "The partial organization."
  node: PartialOrganization!
    @project(deep: true)
}

input QueryWorkspaceByNamespaceInput {
  "The default workspace namespace to lookup."
  namespace: String!
  "When in strict mode (default), an error will be thrown when the workspace is not found."
  strict: Boolean! = true
}

`;
