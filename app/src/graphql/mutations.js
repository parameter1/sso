import gql from 'graphql-tag';

// eslint-disable-next-line import/prefer-default-export
export const UPDATE_OWN_USER_NAMES = gql`
  mutation UpdateOwnUserNames($input: OwnUserNamesInput!) {
    ownUserNames(input: $input) {
      _id
    }
  }
`;
