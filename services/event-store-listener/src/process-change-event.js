import { pubSubManager, COMMAND_PROCESSED } from './pubsub.js';
import commandProcessor from './processor.js';
import { upsertChangeResult } from './utils.js';

const { log } = console;

export async function processChangeEvent(change, { debug = false } = {}) {
  const { _id: eventId } = change.documentKey;
  const { fullDocument } = change;
  const { entityId, entityType } = fullDocument;

  const key = `${entityType}.${JSON.stringify(entityId)} (event: ${eventId})`;
  if (debug) log('START', key);

  // @todo if the processor service returns a bad response, should this fail the container?
  const ok = await commandProcessor.request('processOne', {
    _id: eventId,
    entityId,
    entityType,
  });

  await pubSubManager.publish(COMMAND_PROCESSED, { ok, result: fullDocument });
  const event = { _id: eventId, date: fullDocument.date, entityType };
  await upsertChangeResult({ _id: change._id, event });
  if (debug) log('END', key, { ok });
}
