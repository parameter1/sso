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
};
