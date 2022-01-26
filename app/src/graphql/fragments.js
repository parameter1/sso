// eslint-disable-next-line
export const CURRENT_USER_FRAGMENT = gql`
  fragment CurrentUserFragment on User {
    id
    email
    name
    givenName
    familyName
  }
`;
