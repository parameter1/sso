import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { covertActionError } from '@parameter1/micro-ejson';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { EntityTypes } from '@parameter1/sso-entity-types';

import { normalizeTypesSchema } from '@parameter1/sso-service-client-entity-normalizer';

import { normalizedRepoManager, store } from './mongodb.js';

const { array, object } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-service-client-entity-normalizer")
 *  .NormalizeTypesSchema} NormalizeTypesSchema
 */
export default {
  /**
   *
   * @returns {Promise<Array<string, string>>}
   */
  createIndexes: async () => {
    const map = await normalizedRepoManager.createAllIndexes();
    return [...map];
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

  /**
   *
   * @param {NormalizeTypesSchema} params
   * @returns {Promise<Array<string, string>>}
   */
  types: async (params) => {
    const { entityTypes } = await validateAsync(normalizeTypesSchema, params);
    return covertActionError(() => Promise.all(entityTypes.map(async (entityType) => {
      await store.normalize(entityType, { entityIds: [] });
      return [entityType, 'ok'];
    })));
  },
};
