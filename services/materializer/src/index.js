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
    const { fullDocument } = change;
    const { entityId, entityType } = fullDocument;

    const key = `${entityType}.${JSON.stringify(entityId)} (event: ${eventId})`;
    log('START', key);

    // @todo add pub/sub; catch errors and send error events (+ log)

    // normalize
    await entityManager.normalize({ entityType, entityIds: entityId });

    // materialize
    const materialize = entityManager.materialize.bind(entityManager);
    const handlers = {
      /**
       *
       */
      application: () => Promise.all([
        materialize({ entityType: 'application', $match: { _id: entityId } }),
        materialize({ entityType: 'workspace', $match: { appId: entityId } }),
      ]),

      /**
       *
       */
      manager: () => Promise.all([
        materialize({ entityType: 'organization', $match: { _id: entityId.org } }),
        materialize({ entityType: 'user', $match: { _id: entityId.user } }),
      ]),

      /**
       *
       */
      organization: async () => {
        const userIds = await entityManager.normalizedRepos.get('manager').distinct({
          key: '_id.user',
          query: { '_id.org': entityId },
        });
        return Promise.all([
          materialize({ entityType: 'organization', $match: { _id: entityId } }),
          materialize({ entityType: 'user', $match: { _id: { $in: userIds } } }),
          materialize({ entityType: 'workspace', $match: { orgId: entityId } }),
        ]);
      },

      /**
       *
       */
      user: async () => {
        const orgIds = await entityManager.normalizedRepos.get('manager').distinct({
          key: '_id.org',
          query: { '_id.user': entityId },
        });
        return Promise.all([
          materialize({ entityType: 'user', $match: { _id: entityId } }),
          materialize({ entityType: 'organization', $match: { _id: { $in: orgIds } } }),
        ]);
      },
    };

    const handler = handlers[entityType];
    if (handler) {
      await handler();
    } else {
      await materialize({ entityType, $match: { _id: entityId } });
    }

    pubSubManager.publish(COMMAND_PROCESSED, fullDocument);
    log('END', key);
  });
})().catch(immediatelyThrow);
