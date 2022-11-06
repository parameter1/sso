import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { COMMAND_PROCESSED } from './events.js';
import { PubSubManager } from './manager.js';
import { CommandProcessingTimeoutError } from './errors/command-processing-timeout.js';

const {
  array,
  func,
  integer,
  object,
} = PropTypes;

/**
 * @param {object} params
 * @param {PubSubManager} params.pubSubManager
 * @param {function} params.command
 * @param {number} [params.timeoutMS=5000]
 * @param {function} [params.log]
 */
export async function waitUntilProcessed(params) {
  const {
    pubSubManager,
    command,
    args,
    timeoutMS,
    log,
  } = await validateAsync(object({
    pubSubManager: object().instance(PubSubManager).required(),
    command: func().required(),
    args: array(),
    timeoutMS: integer().min(250).max(15000).default(5000),
    log: func().default(() => () => {}),
  }).required(), params);
  let timeout;

  log('> Executing...');
  await pubSubManager.subscribe(COMMAND_PROCESSED);
  const results = await command(...args);

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
}
