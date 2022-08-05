import { gql } from '@parameter1/graphql/tag';

import user from './user.js';

export default gql`

scalar DateTime
scalar ObjectID

directive @auth on FIELD_DEFINITION
directive @array(field: String) on FIELD_DEFINITION
directive @connectionProject(type: String!) on OBJECT
directive @interfaceFields on OBJECT
directive @object(field: String) on FIELD_DEFINITION
directive @project(
  field: String
  needs: [String!]! = []
  deep: Boolean! = false
  resolve: Boolean! = true
  prefixNeedsWith: String
) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

type Query {
  "A simple ping/pong query."
  ping: String!
}

type Mutation {
  "A simple ping/pong mutation."
  ping: String!
}

type DocumentMeta {
  created: DocumentMetaCreated!
    @project(deep: true)
  modified: DocumentMetaModified!
    @project(deep: true)
  touched: DocumentMetaTouched!
    @project(deep: true)
}

type DocumentMetaCreated {
  date: DateTime!
    @project
  userId: ObjectID
    @project
}

type DocumentMetaModified {
  date: DateTime!
    @project
  n: Int!
    @project
  userId: ObjectID
    @project
}

type DocumentMetaTouched {
  date: DateTime!
    @project
  n: Int!
    @project
  userId: ObjectID
    @project
}

${user}

`;