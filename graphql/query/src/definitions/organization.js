import { gql } from '@parameter1/sso-graphql';

export default gql`

enum OrganizationManagerRoleEnum {
  OWNER
  ADMINISTRATOR
  MANAGER
}

interface OrganizationInterface {
  "The unique organization identifier"
  _id: ObjectID!
    @project
  "Email domains associated with this organization."
  emailDomains: [String!]!
    @project
    @array
  "The unique organization key."
  key: String!
    @project
  "The organization name."
  name: String!
    @project
  "The organization slug."
  slug: String!
    @project
}

type Organization implements OrganizationInterface @interfaceFields {
  "The unique organization identifier"
  _id: ObjectID!
    @project
}

type PartialOrganization implements OrganizationInterface @interfaceFields {
  "The owning document."
  _owner: Organization!
    @loadOwner(type: ORGANIZATION)
}

`;
