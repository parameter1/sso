import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { EntityTypes } from '@parameter1/sso-entity-types';

import { store } from './mongodb.js';

const { array, object } = PropTypes;

export default {
  all: async () => {
    const entityTypes = EntityTypes.getKeys();
    return covertActionError(() => Promise.all(entityTypes.map(async (entityType) => {
      await store.normalize(entityType, { entityIds: [] });
      return [entityType, 'ok'];
    })));
  },

  entities: async (params) => {
    const { entityIds, entityType } = await validateAsync(object({
      entityIds: array().items(eventProps.entityId.required()).required(),
      entityType: eventProps.entityType.required(),
    }).required(), params);

    const ids = attempt(entityIds, array().items(getEntityIdPropType(entityType).required()));

    await covertActionError(() => store.normalize(entityType, { entityIds: ids }));
    return 'ok';
  },

  getEntityTypes() {
    return EntityTypes.getKeys();
  },

  ping: () => 'pong',

  types: async (params) => {
    const { entityTypes } = await validateAsync(object({
      entityTypes: array().items(
        eventProps.entityType.required(),
      ).required(),
    }).required(), params);

    return covertActionError(() => Promise.all(entityTypes.map(async (entityType) => {
      await store.normalize(entityType, { entityIds: [] });
      return [entityType, 'ok'];
    })));
  },
};
