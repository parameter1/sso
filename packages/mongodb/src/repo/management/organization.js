import { PropTypes, validateAsync } from '@sso/prop-types';

import AbstractManagementRepo from './-abstract.js';
import { contextSchema, organizationSchema } from '../../schema/index.js';
import runTransaction from '../../utils/run-transaction.js';

const { object, objectId } = PropTypes;

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
   * Deletes a single organization by ID and all associated documents.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {object} params.session
   * @param {object} params.context
   * @returns {Promise<object>}
   */
  async deleteForId(params) {
    const { id, session: currentSession, context } = await validateAsync(object({
      id: objectId().required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return runTransaction(async ({ session }) => {
      const r = await Promise.all([
        // delete the org
        super.deleteForId({
          id,
          session,
          context,
        }),
        // delete all related managers
        this.manager.$('manager').delete({
          filter: { 'organization._id': id },
          many: true,
          context,
          session,
        }),
        // @todo, delete all related workspaces and workspace members
      ]);
      return r;
    }, { client: this.client, currentSession });
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
