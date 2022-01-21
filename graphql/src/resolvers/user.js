import { getProjectionForType } from '@parameter1/graphql/projection';
import createLoginLinkTemplate from '../email-templates/login-link.js';
import { send } from '../sendgrid.js';
import { APP_URL } from '../env.js';

export default {
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    async loginUserFromLink(_, { input }, { ip, repos, ua }) {
      const { loginLinkToken } = input;
      return repos.$('user').magicLogin({ loginLinkToken, ip, ua });
    },

    /**
     *
     */
    async sendUserLoginLink(_, { input }, { ip, repos, ua }) {
      const { email, redirectTo } = input;
      await repos.$('user').createLoginLinkToken({
        email,
        ip,
        ua,
        inTransaction: async (data) => {
          const { subject, html, text } = createLoginLinkTemplate({
            appUrl: APP_URL,
            loginToken: data.token.signed,
            redirectTo,
          });
          await send({
            to: data.user.email,
            subject,
            html,
            text,
          });
        },
      });
      return 'ok';
    },
  },

  /**
   *
   */
  UserAuth: {
    /**
     *
     */
    expiresAt({ authDoc }) {
      return authDoc.expiresAt;
    },

    /**
     *
     */
    user({ userId }, _, { repos }, info) {
      const options = { projection: getProjectionForType(info) };
      return repos.$('user').findByObjectId({ id: userId, options });
    },
  },
};
