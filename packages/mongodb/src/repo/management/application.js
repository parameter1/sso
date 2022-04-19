import { PropTypes, validateAsync } from '@sso/prop-types';

import AbstractManagementRepo from './-abstract.js';
import { applicationProps, applicationSchema, contextSchema } from '../../schema/index.js';

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
   * Changes the name for the provided application ID.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {string} params.name
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns {Promise<BulkWriteResult>}
   */
  async updateName(params) {
    const {
      id,
      name,
      session,
      context,
    } = await validateAsync(object({
      id: applicationProps.id.required(),
      name: applicationProps.name.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.update({
      filter: { _id: id, name: { $ne: name } },
      many: false,
      update: [{ $set: { name } }],
      session,
      context,
    });
  }
}
