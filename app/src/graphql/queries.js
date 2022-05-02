import gql from 'graphql-tag';
import { CurrentUserFragment } from './fragments';

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      ...CurrentUserFragment
    }
  }
  ${CurrentUserFragment}
`;

export const PING = gql`
  query Ping {
    ping
  }
`;
