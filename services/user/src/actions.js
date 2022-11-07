import { userManager } from './mongodb.js';

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
};
