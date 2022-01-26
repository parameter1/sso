import gql from 'graphql-tag';
import { CURRENT_USER_FRAGMENT } from './fragments';

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      ...CurrentUserFragment
    }
  }
  ${CURRENT_USER_FRAGMENT}
`;

export const PING = gql`
  query Ping {
    ping
  }
`;
