import { gql } from '@parameter1/graphql/tag';

export default gql`

enum OrganizationManagerRoleEnum {
  OWNER
  ADMINISTRATOR
  MANAGER
}

interface OrganizationInterface {
  "The unique organization identifier"
  _id: ObjectID! @project
  "Email domains associated with this organization."
  emailDomains: [String!]! @project @array
  "The unique organization key."
  key: String! @project
  "The organization name."
  name: String! @project
  "The organization slug."
  slug: String! @project
}

type Organization implements OrganizationInterface @interfaceFields {
  "Related edges."
  _edge: Organization_Edge! @project(deep: true) @object
}

type OrganizationPartial implements OrganizationInterface @interfaceFields {
  "The owning document."
  _owner: Organization! @loadOwner(type: ORGANIZATION)
}

type Organization_Edge {
  "The created by edge."
  createdBy: Organization_EdgeCreatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
  "The updated by edge."
  updatedBy: Organization_EdgeUpdatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
}

type Organization_EdgeCreatedBy {
  "The user that first created the organization."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

type Organization_EdgeUpdatedBy {
  "The user that last updated the organization."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

`;
