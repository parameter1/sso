import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';

import { commands } from './mongodb.js';
import { waitUntilProcessed } from './pubsub.js';

const { array, boolean, object } = PropTypes;

const extractClassMethodNames = (instance) => {
  const proto = Object.getPrototypeOf(instance);
  return Object.getOwnPropertyNames(proto).filter((prop) => {
    if (prop === 'constructor') return false;
    return typeof instance[prop] === 'function';
  });
};

export default {
  ...Object.keys(commands).reduce((o, type) => {
    const instance = commands[type];
    const methodNames = extractClassMethodNames(instance);
    if (!methodNames.length) return o;
    return {
      ...o,
      [type]: methodNames.reduce((o2, name) => {
        const method = instance[name].bind(instance);
        return {
          ...o2,
          [name]: async (params) => {
            const { input, awaitProcessing } = await validateAsync(object({
              input: array().items(object().required()).required(),
              awaitProcessing: boolean().default(false),
            }).required(), params);

            if (awaitProcessing) {
              return waitUntilProcessed(() => method({ input }));
            }
            return method({ input });
          },
        };
      }, {}),
    };
  }, {}),

  ping: () => 'pong',
};
