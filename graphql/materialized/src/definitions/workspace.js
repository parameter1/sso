import { gql } from '@parameter1/graphql/tag';

export default gql`

interface WorkspaceInterface {
  "The unique workspace identifier"
  _id: ObjectID! @project
  "Dates associated with this workspace, such as first created and last updated."
  date: WorkspaceDate! @project(field: "_date", deep: true) @object
  "The workspace key."
  key: String! @project
  "The workspace name."
  name: String! @project
  "The unique workspace namespace."
  namespace: String! @project
  "The workspace path."
  path: String! @project
  "The workspace slug."
  slug: String! @project
}

type Workspace implements WorkspaceInterface @interfaceFields {
  "Related edges."
  _edge: Workspace_Edge! @project(deep: true) @object
}

type WorkspacePartial implements WorkspaceInterface @interfaceFields {
  "The owning document."
  _owner: Workspace! @loadOwner(type: WORKSPACE)
  "Related edges."
  _edge: WorkspacePartial_Edge! @project(deep: true) @object
}

type Workspace_Edge {
  application: Workspace_EdgeApplication!
    @project(deep: true)
    @filterDeleted(field: "node")
  "The created by edge."
  createdBy: Workspace_EdgeCreatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
  organization: Workspace_EdgeOrganization!
    @project(deep: true)
    @filterDeleted(field: "node")
  "The updated by edge."
  updatedBy: Workspace_EdgeUpdatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
}

type Workspace_EdgeApplication {
  node: ApplicationPartial! @project(deep: true, needs: ["node._deleted"])
}

type Workspace_EdgeCreatedBy {
  "The user that first created the workspace."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

type Workspace_EdgeOrganization {
  node: OrganizationPartial! @project(deep: true, needs: ["node._deleted"])
}

type Workspace_EdgeUpdatedBy {
  "The user that last updated the workspace."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

type WorkspacePartial_Edge {
  application: WorkspacePartial_EdgeApplication!
    @project(deep: true)
    @filterDeleted(field: "node")
  organization: WorkspacePartial_EdgeOrganization!
    @project(deep: true)
    @filterDeleted(field: "node")
}

type WorkspacePartial_EdgeApplication {
  node: ApplicationPartial! @project(deep: true, needs: ["node._deleted"])
}

type WorkspacePartial_EdgeOrganization {
  node: OrganizationPartial! @project(deep: true, needs: ["node._deleted"])
}

type WorkspaceDate {
  "The ISO date when the workspace was created."
  created: DateTime! @project
  "The ISO date when the workspace was last updated."
  updated: DateTime! @project
}

`;
