import { MaterializedRepo } from './-root.js';

export class MaterializedOrganizationRepo extends MaterializedRepo {
  /**
   * @param {import("./-root").MaterializedRepoConstructorParams} params
   */
  constructor(params) {
    super({
      ...params,
      entityType: 'organization',
      indexes: [
        { key: { '_connection.manager.edges.node._id': 1 } },

        { key: { key: 1, _id: 1 } },
        { key: { slug: 1, _id: 1 } },
      ],
    });
  }

  /**
   * Finds an organization by key.
   *
   * @param {string} key
   * @param {import("mongodb").FindOptions} [options]
   */
  findByKey(key, options) {
    return this.collection.findOne({ key }, options);
  }
}
