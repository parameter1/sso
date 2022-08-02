import { BaseMaterializedRepo } from './-base.js';

export class MaterializedApplicationRepo extends BaseMaterializedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({
      client,
      entityType: 'application',
      indexes: [
        { key: { key: 1, _id: 1 } },
        { key: { slug: 1, _id: 1 } },
      ],
    });
  }

  /**
   * Finds an application by key.
   *
   * @param {object} params
   * @param {string} params.key
   * @param {object} [params.options]
   */
  findByKey({ key, options } = {}) {
    return this.findOne({ query: { key }, options });
  }
}
