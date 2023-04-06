import { ObjectId } from '@parameter1/mongodb-core';
import { AbstractSource } from './-abstract.js';

export class IdentityXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {import("@parameter1/mongodb-core").MongoClient} params.mongo
   * @param {string} params.orgId The IdentityX organization ID
   * @param {string[]} [params.appIds=[]] Application IDs to use. An empty values signifies all.
   */
  constructor({ mongo, orgId, appIds = [] }) {
    if (!/^[a-f0-9]{24}$/.test(`${orgId}`)) throw new Error(`Invalid IdentityX org ID: ${orgId}`);

    super({ kind: 'identity-x', key: `${orgId}` });
    this.mongo = mongo;
    this.db = mongo.db('identity-x');
    this.org = new ObjectId(`${orgId}`);
    /** @type {ObjectId[]} */
    this.appIds = [...appIds.reduce((map, appId) => {
      const key = `${appId}`;
      if (!/^[a-f0-9]{24}$/.test(`${key}`)) throw new Error(`Invalid IdentityX app ID: ${key}`);
      map.set(key, new ObjectId(appId));
      return map;
    }, new Map()).values()];
  }
}
