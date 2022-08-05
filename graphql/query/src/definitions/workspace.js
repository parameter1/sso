import { gql } from '@parameter1/graphql/tag';

export default gql`

interface WorkspaceInterface {
  "The unique workspace identifier"
  _id: ObjectID!
    @project
  "Metadata containing the created, modified, and touched info."
  _meta: DocumentMeta!
    @project(deep: true)
  "The workspace key."
  key: String!
    @project
  "The workspace name."
  name: WorkspaceInterfaceName!
    @project(field: "", deep: true)
    @object
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

type WorkspaceInterfaceName {
  default: String!
    @project(field: "name")
  full: String!
    @project(field: "fullName")
  parts: [String!]!
    @project(field: "nameParts")
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
  _id: ObjectID! @project
}

`;
