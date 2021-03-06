import gql from 'graphql-tag';
import { makeVar } from '@apollo/client/core';
import apollo from '../apollo';
import tokenStorage from './token-storage';
import addTokenListener from './add-token-listener';
import constants from '../constants';
import isRedirect from '../utils/is-redirect';

const { BASE } = constants;

const loggedIn = makeVar(tokenStorage.exists());

const SEND_USER_LOGIN_LINK = gql`
  mutation SendUserLogingLink($input: MutateSendUserLoginLinkInput!) {
    sendUserLoginLink(input: $input)
  }
`;

const LOGIN_USER_FROM_LINK = gql`
  mutation LoginUserFromLink($input: MutateLoginUserFromLinkInput!) {
    loginUserFromLink(input: $input) {
      user { _id }
      authToken
      expiresAt
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logoutUser
  }
`;

const redirectOrReload = ({ next }) => {
  const redirect = isRedirect(next);
  let href = BASE;
  if (redirect.valid) {
    href = next;
    if (redirect.type === 'internal' && !next.startsWith(BASE)) {
      href = `${BASE.replace(/\/$, ''/)}/${next.replace(/^\//, '')}`;
    }
  }
  window.location.href = href;
};

const clearTokensAndReload = ({ next } = {}) => {
  tokenStorage.remove();
  loggedIn(false);
  apollo.clearStore();
  redirectOrReload({ next });
};

export default {
  isLoggedIn: () => loggedIn(),

  /**
   *
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
    const { data } = await apollo.mutate({
      mutation: LOGIN_USER_FROM_LINK,
      variables: { input },
    });
    const { loginUserFromLink } = data;
    tokenStorage.set({
      uid: loginUserFromLink.user.id,
      value: loginUserFromLink.authToken,
      expiresAt: loginUserFromLink.expiresAt,
    });
    loggedIn(true);
    return loginUserFromLink;
  },

  logout: async ({ next } = {}) => {
    try {
      await apollo.mutate({ mutation: LOGOUT });
    } finally {
      // always clear tokens, even on error
      clearTokensAndReload({ next });
    }
  },

  sendUserLoginLink: async ({ email, next, appKey } = {}) => {
    const redirectTo = isRedirect(next) ? next : null;
    const input = { email, redirectTo, applicationKey: appKey };
    await apollo.mutate({
      mutation: SEND_USER_LOGIN_LINK,
      variables: { input },
    });
  },
};
