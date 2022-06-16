import { gql } from '@parameter1/graphql/tag';

export default gql`

type Organization {
  "The unique organization identifier"
  _id: ObjectID! @project
  "Email domains associated with this organization."
  emailDomains: [String!]! @project @array
  "The unique organization key."
  key: String! @project
  "The organization name."
  name: String! @project
}

`;
