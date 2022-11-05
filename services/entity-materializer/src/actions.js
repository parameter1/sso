import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';

import { materializers } from './mongodb.js';

const { array, object, string } = PropTypes;

export default {
  all: async () => {
    const entityTypes = materializers.getBuilderTypes();
    return covertActionError(() => Promise.all(entityTypes.map(async (entityType) => {
      await materializers.materializeUsingQuery(entityType, {});
      return [entityType, 'ok'];
    })));
  },

  entities: async (params) => {
    const { entityIds, entityType } = await validateAsync(object({
      entityIds: array().items(eventProps.entityId.required()).required(),
      entityType: eventProps.entityType.required(),
    }).required(), params);

    const ids = attempt(entityIds, array().items(getEntityIdPropType(entityType).required()));

    await covertActionError(() => materializers.materialize(entityType, { entityIds: ids }));
    return 'ok';
  },

  getEntityTypes() {
    return materializers.getBuilderTypes();
  },

  ping: () => 'pong',

  types: async (params) => {
    const { entityTypes } = await validateAsync(object({
      entityTypes: array().items(
        string().valid(...materializers.getBuilderTypes()).required(),
      ).required(),
    }).required(), params);

    return covertActionError(() => Promise.all(entityTypes.map(async (entityType) => {
      await materializers.materializeUsingQuery(entityType, {});
      return [entityType, 'ok'];
    })));
  },

  usingQuery: async (params) => {
    const { entityType, $match } = await validateAsync(object({
      entityType: string().valid(...materializers.getBuilderTypes()).required(),
      $match: object().required(),
    }).required(), params);

    return covertActionError(async () => {
      await materializers.materializeUsingQuery(entityType, $match);
      return 'ok';
    });
  },
};
