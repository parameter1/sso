import { filterMongoURL, DB_NAME } from '@parameter1/sso-mongodb';
import { immediatelyThrow } from '@parameter1/utils';
import process from 'process';

import pkg from '../package.js';
import { mongodb } from './mongodb.js';
import { pubSubManager, COMMAND_PROCESSED } from './pubsub.js';
import { processCommand } from './process-command.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

/**
 * @todo partition the change stream services so multiple containers can run
 */
(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here
  await Promise.all([
    (async () => {
      log('Connecting to MongoDB...');
      const c = await mongodb.connect();
      log(`MongoDB connected on ${filterMongoURL(c)}`);
    })(),
    (async () => {
      log('Connecting to Redis pub/sub...');
      await pubSubManager.connect();
      log('Redis connected.');
    })(),
  ]);

  const resumeCollection = await mongodb.collection({
    dbName: DB_NAME,
    name: 'event-store/change-stream-tokens',
  });
  const token = await resumeCollection.findOne({}, { sort: { _id: -1 } });
  if (token) log(`Starting after ${JSON.stringify(token)}`);

  const changeStream = await mongodb.watch({
    pipeline: [
      {
        $match: {
          'ns.db': DB_NAME,
          'ns.coll': 'event-store',
        },
      },
    ],
    options: {
      fullDocument: 'updateLookup',
      ...(token && { startAfter: token._id }),
    },
  });

  changeStream.on('change', async (change) => {
    if (change.operationType !== 'insert') return;
    const { _id: eventId } = change.documentKey;
    const { fullDocument } = change;
    const { entityId, entityType } = fullDocument;

    const key = `${entityType}.${JSON.stringify(entityId)} (event: ${eventId})`;
    log('START', key);

    const ok = await processCommand({ entityType, entityId });

    await pubSubManager.publish(COMMAND_PROCESSED, { ok, result: fullDocument });

    await resumeCollection.updateOne({ _id: change._id }, [{
      $set: {
        _id: change._id,
        date: '$$NOW',
        event: { _id: eventId, date: fullDocument.date, entityType },
      },
    }], { upsert: true });
    log('END', key);
  });
})().catch(immediatelyThrow);
