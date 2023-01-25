import gql from 'graphql-tag';
import { makeVar } from '@apollo/client/core';
import apollo from '../apollo';
import { AuthTokenStorage } from './token-storage';
import addTokenListener from './add-token-listener';
import isRedirect from '../utils/is-redirect';

const loggedIn = makeVar(AuthTokenStorage.exists());

const SEND_USER_LOGIN_LINK = gql`
  mutation SendUserLoginLink($input: SendUserLoginLinkInput!) {
    sendUserLoginLink(input: $input)
  }
`;

const LOGIN_USER_FROM_LINK = gql`
  mutation LoginUserFromLink($input: LoginUserFromLinkInput!) {
    loginUserFromLink(input: $input) {
      userId
      authToken: value
      expiresAt
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logoutMagicUser
  }
`;

const redirectOrReload = ({ next }) => {
  const redirect = isRedirect(next);
  let href = '/';
  if (redirect.valid) href = next;
  window.location.href = href;
};

const clearTokensAndReload = ({ next } = {}) => {
  AuthTokenStorage.remove();
  loggedIn(false);
  apollo.command.clearStore();
  apollo.query.clearStore();
  redirectOrReload({ next });
};

export default {
  isLoggedIn: () => loggedIn(),

  /**
   * @deprecated
   */
  attachStorageListener: () => {
    const getRedirect = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('next');
    };

    addTokenListener({
      onAdd: () => {
        // user has likely logged in. reload the app.
        redirectOrReload({ next: getRedirect() });
      },
      onRemove: () => {
        // user should be logged out
        clearTokensAndReload({ next: getRedirect() });
      },
    });
  },

  loginUserFromLink: async ({ loginLinkToken } = {}) => {
    const input = { loginLinkToken };
    const { data } = await apollo.command.mutate({
      mutation: LOGIN_USER_FROM_LINK,
      variables: { input },
    });
    const { loginUserFromLink } = data;
    // @todo determine if, at some point, we want to use the `userId` and `expiresAt` values.
    AuthTokenStorage.set(loginUserFromLink.authToken);
    loggedIn(true);
    return loginUserFromLink;
  },

  logout: async ({ next } = {}) => {
    try {
      await apollo.command.mutate({ mutation: LOGOUT });
    } finally {
      // always clear tokens, even on error
      clearTokensAndReload({ next });
    }
  },

  sendUserLoginLink: async ({ email, next } = {}) => {
    const redirectTo = isRedirect(next) ? next : null;
    const input = { email, redirectTo };
    await apollo.command.mutate({
      mutation: SEND_USER_LOGIN_LINK,
      variables: { input },
    });
  },
};
