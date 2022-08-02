import { filterMongoURL, DB_NAME } from '@parameter1/sso-mongodb';
import { immediatelyThrow } from '@parameter1/utils';

import pkg from '../package.js';
import { mongodb, entityManager } from './mongodb.js';
import { pubSubManager, COMMAND_PROCESSED } from './pubsub.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

/**
 * @todo needs graceful shutdown and restart
 * @todo determine how to cache resume tokens and handle on fail/shutdown
 * @todo partition the change stream services so multiple containers can run
 */
(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here
  const [mongo] = await Promise.all([
    (async () => {
      log('Connecting to MongoDB...');
      const client = await mongodb.connect();
      log(`MongoDB connected on ${filterMongoURL(client)}`);
      return client;
    })(),
    (async () => {
      log('Connecting to Redis pub/sub...');
      await pubSubManager.connect();
      log('Redis connected.');
    })(),
  ]);

  const changeStream = mongo.watch([
    {
      $match: {
        'ns.db': DB_NAME,
        'ns.coll': 'event-store',
      },
    },
  ], { fullDocument: 'updateLookup' });
  changeStream.on('change', async (change) => {
    if (change.operationType !== 'insert') return;
    const { _id: eventId } = change.documentKey;
    const { entityId, entityType } = change.fullDocument;

    const key = `${entityType}.${entityId} (event: ${eventId})`;
    log('START', key);

    // @todo add pub/sub; catch errors and send error events (+ log)

    // normalize
    await entityManager.normalize({ entityType, entityIds: entityId });

    // materialize
    await entityManager.materialize({ entityType, $match: { _id: entityId } });
    // @todo add cross-materialization handlers

    pubSubManager.publish(COMMAND_PROCESSED, change.fullDocument);
    log('END', key);
  });
})().catch(immediatelyThrow);
