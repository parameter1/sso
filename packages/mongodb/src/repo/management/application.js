import { PropTypes, validateAsync } from '@sso/prop-types';

import AbstractManagementRepo from './-abstract.js';
import { applicationProps, applicationSchema } from '../../schema/index.js';
import { buildUpdatePipeline } from '../../pipelines/index.js';

const { object } = PropTypes;

export default class ApplicationRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'applications',
      collatableFields: [],
      indexes: [
        { key: { key: 1 }, unique: true },
      ],
      schema: applicationSchema,
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

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   */
  async updateProps(params = {}) {
    const { id, name } = await validateAsync(object({
      id: applicationProps.id.required(),
      name: applicationProps.name,
    }).required(), params);

    const fields = [];
    if (name) fields.push({ path: 'name', value: name });
    if (!fields.length) return null; // noop
    return this.updateOne({
      query: { _id: id },
      update: buildUpdatePipeline(fields),
      options: { strict: true },
    });
  }
}
