import { PropTypes, validateAsync } from '@sso/prop-types';

import AbstractManagementRepo from './-abstract.js';
import {
  contextSchema,
  managerProps,
  managerSchema,
  organizationProps,
  userProps,
} from '../../schema/index.js';
import { buildUpdatePipeline } from '../../pipelines/index.js';

const { object } = PropTypes;

export default class ManagerRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'managers',
      collatableFields: [],
      indexes: [
        { key: { 'user._id': 1, 'organization._id': 1 }, unique: true },
        { key: { 'organization._id': 1 } },
      ],
      schema: managerSchema,
    });
  }

  /**
   * Chnages a manager role for the provided org and user IDs.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.orgId
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns {Promise<object>}
   */
  async changeRole(params) {
    const {
      userId,
      orgId,
      role,
      context,
      session,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      orgId: organizationProps.id.required(),
      role: managerProps.role.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const query = { 'user._id': userId, 'organization._id': orgId };
    return this.updateOne({
      query,
      update: buildUpdatePipeline([
        { path: 'role', value: role },
      ], { isVersioned: this.isVersioned, source: this.source, context }),
      options: { session },
    });
  }

  /**
   * Removes a manager for the provided org and user IDs.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.orgId
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns {Promise<object>}
   */
  async removeManager(params) {
    const {
      userId,
      orgId,
      context,
      session,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      orgId: organizationProps.id.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.delete({
      filter: { 'user._id': userId, 'organization._id': orgId },
      many: false,
      context,
      session,
    });
  }
}
