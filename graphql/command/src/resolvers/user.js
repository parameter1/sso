import { userManager } from '../service-clients.js';

export default {
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    async loginUserFromLink(_, { input }, { ip, ua }) {
      const { loginLinkToken } = input;
      const {
        authToken,
        userId,
        authDoc,
      } = await userManager.request('magicLogin', { loginLinkToken, ip, ua });
      return { value: authToken, expiresAt: authDoc.expiresAt, userId };
    },

    /**
     *
     */
    async logoutMagicUser(_, __, { auth, ip, ua }) {
      const authToken = await auth.getMagicAuthToken();
      return userManager.request('logoutMagicUser', { authToken, ip, ua });
    },

    /**
     * @todo pass ip and ua context values to command
     */
    async ownUserNames(_, { input }, { auth }) {
      const entityId = await auth.getUserId();
      return {
        action: 'user.changeName',
        input: [{
          entityId,
          familyName: input.family,
          givenName: input.given,
          userId: entityId,
        }],
      };
    },

    /**
     *
     */
    async sendUserLoginLink(_, { input }, { ip, ua }) {
      const { email, redirectTo } = input;
      await userManager.request('createLoginLinkToken', {
        email,
        ip,
        ua,
        emailOptions: { send: true, redirectTo },
      });
      return 'ok';
    },
  },
};
