import { gql } from '@parameter1/graphql/tag';

export default gql`

extend type Query {
  "Determines if the provided application key exists."
  applicationKeyExists(input: QueryApplicationKeyExistsInput!): Boolean!
}

interface ApplicationInterface {
  "The unique application identifier"
  _id: ObjectID!
    @project
  "The unique application key."
  key: String!
    @project
  "The application name."
  name: String!
    @project
  "The application slug."
  slug: String!
    @project
  "Membership roles that this application supports."
  roles: [String!]!
    @project
    @array
    @auth
}

type Application implements ApplicationInterface @interfaceFields {
  "The unique application identifier"
  _id: ObjectID!
    @project
}

type PartialApplication implements ApplicationInterface @interfaceFields {
  "The owning document."
  _owner: Application!
    @loadOwner(type: APPLICATION)
}

input QueryApplicationKeyExistsInput {
  "The application key to check."
  value: String!
}

`;
