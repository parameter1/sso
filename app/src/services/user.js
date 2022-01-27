import gql from 'graphql-tag';
import { makeVar } from '@apollo/client/core';
import apollo from '../apollo';
import tokenStorage from './token-storage';
import addTokenListener from './add-token-listener';
import constants from '../constants';

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
      user { id email name }
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

const clearTokensAndReload = ({ redirectTo } = {}) => {
  tokenStorage.remove();
  loggedIn(false);
  apollo.clearStore();
  window.location.href = redirectTo || BASE;
};

export default {
  isLoggedIn: () => loggedIn(),

  /**
   *
   */
  attachStorageListener: ({ redirectTo } = {}) => {
    addTokenListener({
      onAdd: () => {
        // user has likely logged in. relaod the app.
        window.location.href = redirectTo || BASE;
      },
      onRemove: () => {
        // user should be logged out
        clearTokensAndReload({ redirectTo });
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

  logout: async ({ redirectTo } = {}) => {
    try {
      await apollo.mutate({ mutation: LOGOUT });
    } catch (e) {
      // @todo how should this be handled??
    } finally {
      // always clear tokens, even on error
      clearTokensAndReload({ redirectTo });
    }
  },

  sendUserLoginLink: async ({ email, redirectTo } = {}) => {
    const input = { email, redirectTo };
    await apollo.mutate({
      mutation: SEND_USER_LOGIN_LINK,
      variables: { input },
    });
  },
};
