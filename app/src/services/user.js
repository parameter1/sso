import gql from 'graphql-tag';
import { makeVar } from '@apollo/client/core';
import apollo from '../apollo';
import tokenStorage from './token-storage';
import addTokenListener from './add-token-listener';
import constants from '../constants';
import isRedirect from '../utils/is-redirect';

const { BASE, USER_KEY } = constants;

const loggedIn = makeVar(tokenStorage.exists());

const SEND_USER_LOGIN_LINK = gql`
  mutation SendUserLogingLink($input: MutateSendUserLoginLinkInput!) {
    sendUserLoginLink(input: $input)
  }
`;

const LOGIN_USER_FROM_LINK = gql`
  mutation LoginUserFromLink($input: MutateLoginUserFromLinkInput!) {
    loginUserFromLink(input: $input) {
      user {
        id
        email
        givenName
        familyName
      }
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
  if (redirect.value) {
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
  localStorage.removeItem(USER_KEY);
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
    localStorage.setItem(USER_KEY, JSON.stringify(loginUserFromLink.user));
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

  sendUserLoginLink: async ({ email, next } = {}) => {
    const redirectTo = isRedirect(next) ? next : null;
    const input = { email, redirectTo };
    await apollo.mutate({
      mutation: SEND_USER_LOGIN_LINK,
      variables: { input },
    });
  },
};
