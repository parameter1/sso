import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Returns a single workspace by full namespace."
  workspaceByNamespace(input: QueryWorkspaceByNamespaceInput!): Workspace
}

interface WorkspaceInterface {
  "The unique workspace identifier"
  _id: ObjectID! @project
  "The workspace key."
  key: String! @project
  "The workspace name."
  name: String! @project
  "The workspace namespaces."
  namespace: WorkspaceInterfaceNamespace! @project(deep: true) @object
  "The workspace path."
  path: String! @project
  "The workspace slug."
  slug: String! @project
}

type PartialWorkspace implements WorkspaceInterface @interfaceFields {
  "The owning document."
  _owner: Workspace! @loadOwner(type: WORKSPACE)
  "Related edges."
  _edge: PartialWorkspace_Edge! @project(deep: true) @object
}

type PartialWorkspace_Edge {
  application: PartialWorkspace_EdgeApplication!
    @project(deep: true)
    @filterDeleted(field: "node")
  organization: PartialWorkspace_EdgeOrganization!
    @project(deep: true)
    @filterDeleted(field: "node")
}

type PartialWorkspace_EdgeApplication {
  node: PartialApplication! @project(deep: true, needs: ["node._deleted"])
}

type PartialWorkspace_EdgeOrganization {
  node: PartialOrganization! @project(deep: true, needs: ["node._deleted"])
}

type WorkspaceInterfaceNamespace {
  "The full, default and unique workspace namespace."
  default: String! @project
  "The namespace when used inside an application."
  application: String! @project
}

type Workspace implements WorkspaceInterface @interfaceFields {
  "Related edges."
  _edge: Workspace_Edge! @project(deep: true) @object
}

type Workspace_Edge {
  application: Workspace_EdgeApplication!
    @project(deep: true)
    @filterDeleted(field: "node")
  organization: Workspace_EdgeOrganization!
    @project(deep: true)
    @filterDeleted(field: "node")
}

type Workspace_EdgeApplication {
  node: PartialApplication! @project(deep: true, needs: ["node._deleted"])
}

type Workspace_EdgeOrganization {
  node: PartialOrganization! @project(deep: true, needs: ["node._deleted"])
}

input QueryWorkspaceByNamespaceInput {
  "The default workspace namespace to lookup."
  namespace: String!
  "When in strict mode (default), an error will be thrown when the workspace is not found."
  strict: Boolean! = true
}

`;
