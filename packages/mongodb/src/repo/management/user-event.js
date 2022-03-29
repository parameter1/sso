import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@sso/prop-types';

import { userEventProps, userProps } from '../../schema/index.js';
import { buildInsertCriteria, buildInsertPipeline } from '../../pipelines/index.js';

const { object } = PropTypes;

export default class UserEventRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'user-events',
      collatableFields: [],
      indexes: [
        { key: { 'user._id': 1, action: 1 } },
      ],
    });
  }

  /**
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.action
   * @param {Date} [params.date]
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   * @param {object} [params.data]
   * @param {object} [params.session]
   */
  async create(params = {}) {
    const {
      userId,
      action,
      ip,
      ua,
      data,
      session,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      action: userEventProps.action.required(),
      ip: userEventProps.ip,
      ua: userEventProps.ua,
      data: userEventProps.data,
      session: object(),
    }).required(), params);

    return this.updateOne({
      query: buildInsertCriteria(),
      update: buildInsertPipeline({
        user: { _id: userId },
        action,
        ip,
        ua,
        data,
      }, { datePaths: ['date'] }),
      options: { session, upsert: true },
    });
  }
}
