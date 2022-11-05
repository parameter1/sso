import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { commands } from '../mongodb.js';

const {
  array,
  object,
  oneOrMany,
  string,
} = PropTypes;

export default {
  entities: async (params) => {
    const { entityIds, entityType } = await validateAsync(object({
      eventIds: oneOrMany(eventProps.entityId).required(),
      entityType: string().valid(...commands.getEntityTypes()).required(),
    }).required(), params);

    const ids = attempt(entityIds, array().itesm(getEntityIdPropType(entityType)));

    const handler = commands.get(entityType);
    await covertActionError(() => handler.normalize({ entityIds: ids }));
    return 'ok';
  },

  getEntityTypes() {
    return commands.getEntityTypes();
  },

  types: async (params) => {
    const { entityTypes } = await validateAsync(object({
      entityTypes: array().items(
        string().valid(...commands.getEntityTypes()).required(),
      ).required(),
    }).required(), params);

    return covertActionError(() => Promise.all(entityTypes.map(async (entityType) => {
      const handler = commands.get(entityType);
      await handler.normalize({ entityIds: [] });
      return [entityType, 'ok'];
    })));
  },
};
