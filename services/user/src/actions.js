import { userManager } from './mongodb.js';
import { createLoginLinkTemplate } from './email-templates/login-link.js';
import { send } from './sendgrid.js';

const extractClassMethodNames = (instance) => {
  const proto = Object.getPrototypeOf(instance);
  return Object.getOwnPropertyNames(proto).filter((prop) => {
    if (prop === 'constructor') return false;
    return typeof instance[prop] === 'function';
  });
};

export default {
  ping: () => 'pong',

  ...extractClassMethodNames(userManager).reduce((o, methodName) => {
    const method = userManager[methodName].bind(userManager);
    return {
      ...o,
      [methodName]: async (params) => {
        const r = await method(params);
        if (r instanceof Map) return [...r];
        return r;
      },
    };
  }, {}),

  // override to support email sending
  createLoginLinkToken: async ({ emailOptions, ...params }) => {
    if (emailOptions && emailOptions.send) {
      return userManager.createLoginLinkToken({
        ...params,
        inTransaction: async (data) => {
          const { subject, html, text } = createLoginLinkTemplate({
            loginToken: data.token.signed,
            redirectTo: emailOptions.redirectTo,
          });
          await send({
            to: data.user.email,
            subject,
            html,
            text,
          });
        },
      });
    }
    return userManager.createLoginLinkToken(params);
  },
};
