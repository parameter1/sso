import { validateAsync } from '@parameter1/sso-prop-types-core';
import { covertActionError } from '@parameter1/micro-ejson';
import { EntityTypes } from '@parameter1/sso-entity-types';

import { normalizeEntitiesSchema, normalizeTypesSchema } from '@parameter1/sso-service-client-entity-normalizer';

import { normalizedRepoManager, store } from './mongodb.js';

/**
 * @typedef {import("@parameter1/sso-service-client-entity-normalizer")
 *  .NormalizeEntitiesSchema} NormalizeEntitiesSchema
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

  /**
   *
   * @param {NormalizeEntitiesSchema} params
   * @returns {Promise<string>}
   */
  entities: async (params) => {
    const { entityIds, entityType } = await validateAsync(normalizeEntitiesSchema, params);
    await covertActionError(() => store.normalize(entityType, { entityIds }));
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
