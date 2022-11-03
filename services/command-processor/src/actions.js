import { eventProps } from '@parameter1/sso-mongodb';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types';
import { entityManager, materialize } from './mongodb.js';
import handlers from './handlers.js';

const { object } = PropTypes;

const { log } = console;

export default {
  ping: () => 'pong',

  processOne: async (params) => {
    const { _id, entityId, entityType } = await validateAsync(object({
      _id: eventProps._id.required(),
      entityId: entityManager.getEntityIdType(params.entityType),
      entityType: eventProps.entityType.required(),
    }).required(), params);

    const key = `${entityType}.${JSON.stringify(entityId)} (event: ${_id})`;
    log('START', key);

    try {
      await entityManager.normalize({ entityType, entityIds: entityId });
      const handler = handlers[entityType];

      if (handler) {
        await handler({ entityId });
      } else {
        await materialize({ entityType, $match: { _id: entityId } });
      }
      log('END', key, { ok: true });
      return true;
    } catch (e) {
      log('END', key, { ok: false });
      return false;
    }
  },
};
