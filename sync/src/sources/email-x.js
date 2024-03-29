import { ObjectId } from '@parameter1/mongodb-core';
import { AbstractSource } from './-abstract.js';

export class EmailXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {import("@parameter1/mongodb-core").MongoClient} params.mongo
   * @param {string} params.tenant The EmailX tenant key, e.g. `acbm`
   * @param {string[]} [params.publisherIds=[]] Publisher IDs to use. An empty values signifies all.
   */
  constructor({ mongo, tenant, publisherIds = [] }) {
    if (!/^[a-z0-9]{2,}$/.test(tenant)) throw new Error(`Invalid EmailX tenant key: ${tenant}`);

    super({ kind: 'email-x', key: tenant, additionalTenantKeys: ['publisherIds'] });
    this.mongo = mongo;
    this.db = mongo.db(`parcel-plug-${tenant}`);
    this.tenant = tenant;
    /** @type {ObjectId[]} */
    this.publisherIds = [...publisherIds.reduce((map, publisherId) => {
      const key = `${publisherId}`;
      if (!/^[a-f0-9]{24}$/.test(`${key}`)) throw new Error(`Invalid EmailX publisher ID: ${key}`);
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
