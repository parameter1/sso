import { covertActionError } from '@parameter1/micro-ejson';
import { materializers, normalizer } from './mongodb.js';
import { pubSubManager, COMMAND_PROCESSED } from './pubsub.js';

export default {
  ping: () => 'pong',

  processEvent: async ({
    _id,
    entityId,
    entityType,
    userId,
  }) => {
    await covertActionError(async () => {
      await normalizer.normalize({ entityIds: [entityId], entityType });
      // await store.normalize({ entityIds: [entityId], entityType });
      await materializers.materialize(entityType, { entityIds: [entityId] });
      await pubSubManager.publish(COMMAND_PROCESSED, {
        _id,
        entityId,
        entityType,
        userId,
      });
    });
    return 'ok';
  },
};
