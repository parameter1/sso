import { AbstractSource } from './-abstract.js';

export class LeadManagementSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {import("@parameter1/mongodb-core").MongoClient} params.mongo
   * @param {string} params.tenant The lead management tenant key, e.g. `acbm`
   */
  constructor({ mongo, tenant }) {
    if (!/^[a-z0-9]{2,}$/.test(tenant)) throw new Error(`Invalid Lead Management tenant key: ${tenant}`);

    super({ kind: 'lead-management', key: tenant });
    this.mongo = mongo;
    this.db = mongo.db(`lead-management-${tenant}`);
    this.tenant = tenant;
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
