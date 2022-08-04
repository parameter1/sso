import { userManager } from '../mongodb.js';
import createLoginLinkTemplate from '../email-templates/login-link.js';
import { send } from '../sendgrid.js';

export default {
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    async sendUserLoginLink(_, { input }, { ip, ua }) {
      const { email, redirectTo } = input;
      await userManager.createLoginLinkToken({
        email,
        ip,
        ua,
        inTransaction: async (data) => {
          const { subject, html, text } = createLoginLinkTemplate({
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
