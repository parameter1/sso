import { ObjectId } from '@parameter1/mongodb-core';
import { AbstractSource } from './-abstract.js';

export class NativeXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {import("@parameter1/mongodb-core").MongoClient} params.mongo
   * @param {string} params.tenant The NativeX tenant key, e.g. `acbm`
   * @param {string[]} [params.publisherIds=[]] Publisher IDs to use. An empty values signifies all.
   */
  constructor({ mongo, tenant, publisherIds = [] }) {
    if (!/^[a-z0-9]{2,}$/.test(tenant)) throw new Error(`Invalid NativeX tenant key: ${tenant}`);

    super({ kind: 'native-x', key: tenant });
    this.mongo = mongo;
    this.db = mongo.db(`fortnight-${tenant}`);
    this.tenant = tenant;
    /** @type {ObjectId[]} */
    this.publisherIds = [...publisherIds.reduce((map, publisherId) => {
      const key = `${publisherId}`;
      if (!/^[a-f0-9]{24}$/.test(`${key}`)) throw new Error(`Invalid NativeX publisher ID: ${key}`);
      map.set(key, new ObjectId(publisherId));
      return map;
    }, new Map()).values()];
  }

  async loadUsers() {
    const collection = this.db.collection('users');
    return collection.find({}, {
      projection: {
        createdAt: 1,
        deleted: 1,
        email: 1,
        familyName: 1,
        givenName: 1,
        updatedAt: 1,
      },
      sort: { email: 1 },
    }).map(AbstractSource.appendUserDates).toArray();
  }
}
