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
}
