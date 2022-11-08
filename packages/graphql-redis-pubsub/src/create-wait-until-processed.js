import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { COMMAND_PROCESSED } from './events.js';
import { PubSubManager } from './manager.js';
import { CommandProcessingTimeoutError } from './errors/command-processing-timeout.js';

const {
  func,
  integer,
  object,
} = PropTypes;

/**
 * @param {object} params
 * @param {PubSubManager} params.pubSubManager
 * @param {Function} params.command
 * @param {number} [params.timeoutMS=5000]
 * @param {Function} [params.log]
 *
 * @returns {Function}
 */
export function createWaitUntilProcessed(params) {
  const {
    pubSubManager,
    timeoutMS,
    log,
  } = attempt(params, object({
    pubSubManager: object().instance(PubSubManager).required(),
    timeoutMS: integer().min(250).max(15000).default(5000),
    log: func().default(() => () => {}),
  }).required());

  return async (fn) => {
    let timeout;

    log('> Executing...');
    await pubSubManager.subscribe(COMMAND_PROCESSED);
    const results = await fn();

    const r = await Promise.race([
      (new Promise((resolve) => {
        timeout = setTimeout(() => resolve({ timedout: true }), timeoutMS);
      })),
      (async () => {
        log('> Processing...');
        await Promise.all(results.map(async (result) => {
          await new Promise((resolve) => {
            pubSubManager.on(COMMAND_PROCESSED, ({ body }) => {
              if (`${body._id}` !== `${result._id}`) return;
              resolve();
            });
          });
        }));
        return results;
      })(),
    ]).finally(() => pubSubManager.unsubscribe(COMMAND_PROCESSED));

    if (r.timedout) {
      throw new CommandProcessingTimeoutError('The allowed time to process this command has exhausted.', results);
    }
    clearTimeout(timeout);
    return r;
  };
}
