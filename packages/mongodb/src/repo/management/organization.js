import { PropTypes, validateAsync } from '@sso/prop-types';

import AbstractManagementRepo from './-abstract.js';
import { organizationProps, organizationSchema } from '../../schema/index.js';
import { buildUpdatePipeline } from '../../pipelines/index.js';

const { object } = PropTypes;

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

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   */
  async updateProps(params = {}) {
    const { id, name } = await validateAsync(object({
      id: organizationProps.id.required(),
      name: organizationProps.name,
    }).required(), params);

    const fields = [];
    if (name) fields.push({ path: 'name', value: name });
    if (!fields.length) return null; // noop
    return this.updateOne({
      query: { _id: id },
      update: buildUpdatePipeline(fields, {
        isVersioned: this.isVersioned,
        source: this.source,
      }),
      options: { strict: true },
    });
  }
}
