import { validateAsync } from '@parameter1/sso-prop-types-core';
import { EJSONClient } from '@parameter1/micro-ejson';

import { normalizeTypesSchema } from './schema.js';

/**
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
   * Normalizes all events for all entity types.
   *
   * @returns {Promise<Map<string, string>>}
   */
  async normalizeAll() {
    const r = await this.request('all');
    return new Map(r);
  }

  /**
   * Normalizes all events for the provided entity types.
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
