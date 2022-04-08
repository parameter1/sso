import AbstractManagementRepo from './-abstract.js';
import { organizationSchema } from '../../schema/index.js';

export default class OrganizationRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'organizations',
      collatableFields: [],
      indexes: [
        { key: { key: 1 }, unique: true },
      ],
      schema: organizationSchema,
    });
  }

  /**
   * Finds an organization by key.
   *
   * @param {object} params
   * @param {string} params.key
   * @param {object} [params.options]
   */
  findByKey({ key, options } = {}) {
    return this.findOne({ query: { key }, options });
  }
}
