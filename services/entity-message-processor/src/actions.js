import { materializers, store } from './mongodb.js';
import { pubSubManager, COMMAND_PROCESSED } from './pubsub.js';

export default {
  ping: () => 'pong',

  processEvent: async ({
    _id,
    entityId,
    entityType,
    userId,
  }) => {
    await store.normalize({ entityIds: [entityId], entityType });
    await materializers.materialize(entityType, { entityIds: [entityId] });
    await pubSubManager.publish(COMMAND_PROCESSED, {
      _id,
      entityId,
      entityType,
      userId,
    });
  },
};
