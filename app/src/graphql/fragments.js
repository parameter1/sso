import gql from 'graphql-tag';

// eslint-disable-next-line
export const CurrentUserFragment = gql`
  fragment CurrentUserFragment on User {
    _id
    email { address }
    name { given family }
  }
`;
