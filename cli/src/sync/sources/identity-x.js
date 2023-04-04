import { ObjectId } from '@parameter1/mongodb-core';
import { AbstractSource } from './-abstract.js';

export class IdentityXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.orgId The IdentityX organization ID
   * @param {string[]} [params.appIds] Application IDs to use. An empty values signifies all.
   */
  constructor({ orgId, appIds = [] }) {
    if (!/^[a-f0-9]{24}$/.test(`${orgId}`)) throw new Error(`Invalid IdentityX org ID: ${orgId}`);

    super({ kind: 'identity-x', key: `${orgId}` });
    this.org = new ObjectId(`${orgId}`);
    this.appIds = [...appIds.reduce((map, appId) => {
      const key = `${appId}`;
      if (!/^[a-f0-9]{24}$/.test(`${key}`)) throw new Error(`Invalid IdentityX app ID: ${key}`);
      map.set(key, appId);
      return map;
    }, new Map()).values()];
  }
}
