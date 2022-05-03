import { PropTypes, validateAsync } from '@parameter1/prop-types';

import AbstractManagementRepo from './-abstract.js';
import { applicationProps, applicationSchema, contextSchema } from '../../schema/index.js';
import runTransaction from '../../utils/run-transaction.js';

const { array, object, objectId } = PropTypes;

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

        { key: { name: 1, _id: 1 }, collation: { locale: 'en_US' } },
      ],
      schema: applicationSchema,
    });
  }

  /**
   * Deletes multiple documents for the provided IDs. Overloaded to ensure workspaces are also
   * deleted.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {object} params.session
   * @param {object} params.context
   * @returns {Promise<BulkWriteResult>}
   */
  async deleteForIds(params) {
    const { ids, session: currentSession, context } = await validateAsync(object({
      ids: array().items(objectId().required()).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return runTransaction(async ({ session }) => {
      const r = await super.deleteForIds({ ids, session, context });
      await this.manager.$('workspace').delete({
        filter: { 'application._id': { $in: ids } },
        many: true,
        session,
        context,
      });
      return r;
    }, { client: this.client, currentSession });
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
