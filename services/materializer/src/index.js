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

    const materializeWorkspaceUsers = async ({ $match }) => {
      const pipeline = [{
        $match,
      }, {
        $group: { _id: null, workspaceIds: { $addToSet: '$_id' } },
      }, {
        $lookup: {
          from: 'member/normalized',
          localField: 'workspaceIds',
          foreignField: '_id.workspace',
          as: 'members',
          pipeline: [{ $project: { _id: 0, userId: '$_id.user' } }],
        },
      }, {
        $project: { userIds: { $map: { input: '$members', in: '$$this.userId' } } },
      }];
      // @todo the initial lookups to return the IDs doubles the overall materialization time
      // determine if this can all be done in one $merge stage
      const cursor = await entityManager.normalizedRepos.get('workspace').aggregate({ pipeline });
      const result = await cursor.toArray();
      if (!result) return null;
      const [doc] = result;
      if (!doc || !doc.userIds.length) return null;
      return materialize({ entityType: 'user', $match: { _id: { $in: doc.userIds } } });
    };

    const handlers = {
      /**
       *
       */
      application: () => Promise.all([
        materialize({ entityType: 'application', $match: { _id: entityId } }),
        materialize({ entityType: 'workspace', $match: { appId: entityId } }),
        materializeWorkspaceUsers({ $match: { appId: entityId } }),
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
      member: () => Promise.all([
        materialize({ entityType: 'workspace', $match: { _id: entityId.workspace } }),
        materialize({ entityType: 'user', $match: { _id: entityId.user } }),
      ]),

      /**
       *
       */
      organization: () => Promise.all([
        materialize({ entityType: 'organization', $match: { _id: entityId } }),
        materialize({ entityType: 'workspace', $match: { orgId: entityId } }),
        materializeWorkspaceUsers({ $match: { orgId: entityId } }),
        (async () => {
          const userIds = await entityManager.normalizedRepos.get('manager').distinct({
            key: '_id.user',
            query: { '_id.org': entityId },
          });
          if (!userIds.length) return null;
          return materialize({ entityType: 'user', $match: { _id: { $in: userIds } } });
        })(),
      ]),

      /**
       *
       */
      user: () => Promise.all([
        materialize({ entityType: 'user', $match: { _id: entityId } }),
        (async () => {
          const orgIds = await entityManager.normalizedRepos.get('manager').distinct({
            key: '_id.org',
            query: { '_id.user': entityId },
          });
          if (!orgIds.length) return null;
          return materialize({ entityType: 'organization', $match: { _id: { $in: orgIds } } });
        })(),
        (async () => {
          const workspaceIds = await entityManager.normalizedRepos.get('member').distinct({
            key: '_id.workspace',
            query: { '_id.user': entityId },
          });
          if (!workspaceIds.length) return null;
          return materialize({ entityType: 'workspace', $match: { _id: { $in: workspaceIds } } });
        })(),
      ]),

      /**
       *
       */
      workspace: () => Promise.all([
        materialize({ entityType: 'workspace', $match: { _id: entityId } }),
        (async () => {
          const userIds = await entityManager.normalizedRepos.get('member').distinct({
            key: '_id.user',
            query: { '_id.workspace': entityId },
          });
          if (!userIds.length) return null;
          return materialize({ entityType: 'user', $match: { _id: { $in: userIds } } });
        })(),
      ]),
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
