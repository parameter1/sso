import { validateAsync } from '@parameter1/sso-prop-types-core';
import { EJSONClient } from '@parameter1/micro-ejson';

import { normalizeEntitiesSchema, normalizeTypesSchema } from './schema.js';

/**
 * @typedef {import("./schema").NormalizeEntitiesSchema} NormalizeEntitiesSchema
 * @typedef {import("./schema").NormalizeTypesSchema} NormalizeTypesSchema
 */

export class EntityNormalizerServiceClient extends EJSONClient {
  /**
   * Creates indexes for all associated collections.
   *
   * @returns {Promise<Map<string, string[]>>}
   */
  async createIndexes() {
    const r = await this.request('createIndexes');
    return new Map(r);
  }

  /**
   * Gets all eligible entity types for normalization.
   *
   * @returns {Promise<string[]>}
   */
  async getEntityTypes() {
    return this.request('getEntityTypes');
  }

  /**
   * Normalizes entities for the provided type and IDs.
   *
   * @param {NormalizeEntitiesSchema} params
   * @returns {Promise<string>}
   */
  async normalizeEntities(params) {
    /** @type {NormalizeEntitiesSchema} */
    const { entityIds, entityType } = await validateAsync(normalizeEntitiesSchema, params);
    const r = await this.request('entities', { entityIds, entityType });
    return new Map(r);
  }

  /**
   * Normalizes all events for the provided entity types.
   * If empty, all types will be normalized.
   *
   * @param {NormalizeTypesSchema} params
   * @returns {Promise<Map<string, string>>}
   */
  async normalizeTypes(params) {
    /** @type {NormalizeTypesSchema} */
    const { entityTypes } = await validateAsync(normalizeTypesSchema, params);
    const r = await this.request('types', { entityTypes });
    return new Map(r);
  }
}
