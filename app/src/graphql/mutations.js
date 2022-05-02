import gql from 'graphql-tag';

// eslint-disable-next-line import/prefer-default-export
export const UPDATE_OWN_USER_PROFILE = gql`
  mutation UpdateOwnUserProfile($input: MutateOwnUserProfileInput!) {
    ownUserProfile(input: $input) {
      _id
      name { given family }
    }
  }
`;
