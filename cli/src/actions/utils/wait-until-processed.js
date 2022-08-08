import { pubSubManager, COMMAND_PROCESSED } from '../../pubsub.js';

const { log } = console;

/**
 * @todo add timeout
 * @todo figure out how to handle if event if already completed?
 * @todo figure out how to handle event failed?
 * @todo how to retry failed events?
 */
export async function waitUntilProcessed(action) {
  await pubSubManager.subscribe(COMMAND_PROCESSED);
  log('> Executing...');
  const [result] = await action();
  log('> Processing...');
  await new Promise((resolve) => {
    pubSubManager.on(COMMAND_PROCESSED, ({ body }) => {
      if (`${body._id}` === `${result._id}`) resolve();
    });
  });
  log('> Finalizing...');
  await pubSubManager.unsubscribe(COMMAND_PROCESSED);
  return result;
}
