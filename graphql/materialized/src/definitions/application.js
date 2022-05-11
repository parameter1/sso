import { gql } from '@parameter1/graphql/tag';

export default gql`

interface ApplicationInterface {
  "The unique application identifier"
  _id: ObjectID! @project
  "Dates associated with this application, such as first created and last updated."
  date: ApplicationDate! @project(field: "", deep: true) @object
  "The unique application key."
  key: String! @project
  "The application name."
  name: String! @project
  "The application slug."
  slug: String! @project
  "Membership roles that this application supports."
  roles: [String!]! @project @array
}

type Application implements ApplicationInterface @interfaceFields {
  "Related edges."
  _edge: Application_Edge! @project(deep: true) @object
}

type ApplicationPartial implements ApplicationInterface @interfaceFields {
  "The owning document."
  _owner: Application! @loadOwner(type: APPLICATION)
}

type Application_Edge {
  "The created by edge."
  createdBy: Application_EdgeCreatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
  "The updated by edge."
  updatedBy: Application_EdgeUpdatedBy
    @project(deep: true)
    @filterDeleted(field: "node")
}

type Application_EdgeCreatedBy {
  "The user that first created the application."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

type Application_EdgeUpdatedBy {
  "The user that last updated the application."
  node: UserPartial! @project(deep: true, needs: ["node._deleted"])
}

type ApplicationDate {
  "The ISO date when the application was created."
  created: DateTime! @project
  "The ISO date when the application was last updated."
  updated: DateTime! @project
}

`;
