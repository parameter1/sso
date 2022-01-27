import gql from 'graphql-tag';
import { makeVar } from '@apollo/client/core';
import apollo from '../apollo';
import tokenStorage from './token-storage';
import constants from '../constants';

const { TOKEN_KEY, BASE } = constants;

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
  attachStorageListener: () => {
    window.addEventListener('storage', (event) => {
      const { key, newValue } = event;
      // if key is null, all of local storage was cleared. log user out.
      if (key === null) clearTokensAndReload();
      // only act on the token key...
      if (key === TOKEN_KEY) {
        // if a new value is set, reload. this effectively logs the user in.
        if (newValue) {
          window.location.href = BASE;
        } else {
          // otherwise clear tokens and reload.
          clearTokensAndReload();
        }
      }
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
