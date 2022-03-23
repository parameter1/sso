import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@sso/prop-types';

import cleanDocument from '../../utils/clean-document.js';
import { userEventProps, userProps } from '../../schema/index.js';

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
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      userId,
      action,
      date,
      ip,
      ua,
      data,
      options,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      action: userEventProps.action.required(),
      date: userEventProps.date.default(() => new Date()),
      ip: userEventProps.ip,
      ua: userEventProps.ua,
      data: userEventProps.data,
      options: object().default({}),
    }).required(), params);
    const doc = cleanDocument({
      user: { _id: userId },
      action,
      date,
      ip,
      ua,
      data,
    });
    return this.insertOne({ doc, options });
  }
}
