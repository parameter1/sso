import { MaterializedRepo } from './-root.js';

export class MaterializedApplicationRepo extends MaterializedRepo {
  /**
   * @param {import("./-root").MaterializedRepoConstructorParams} params
   */
  constructor(params) {
    super({
      ...params,
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
   * @param {string} key
   * @param {import("mongodb").FindOptions} [options]
   */
  findByKey(key, options) {
    return this.collection.findOne({ key }, options);
  }
}
