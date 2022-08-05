import { gql } from '@parameter1/graphql/tag';
import { paginationDefinitions, sortOrderDefinitions } from '@parameter1/graphql/features';

import user from './user.js';
import workspace from './workspace.js';

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
  at: DateTime!
    @project(field: "date")
  userId: ObjectID
    @project
}

type DocumentMetaModified {
  at: DateTime!
    @project(field: "date")
  n: Int!
    @project
  userId: ObjectID
    @project
}

type DocumentMetaTouched {
  at: DateTime!
    @project(field: "date")
  n: Int!
    @project
  userId: ObjectID
    @project
}

${paginationDefinitions}
${sortOrderDefinitions}

${user}
${workspace}

`;
