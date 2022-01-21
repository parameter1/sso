import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  userAttributes as userAttrs,
  userEventAttributes as eventAttrs,
} from '../schema/attributes/index.js';

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
      user,
      action,
      date,
      ip,
      ua,
      data,
      options,
    } = await validateAsync(Joi.object({
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email.required(),
      }).required(),
      action: eventAttrs.action.required(),
      date: eventAttrs.date.default(() => new Date()),
      ip: eventAttrs.ip,
      ua: eventAttrs.ua,
      data: eventAttrs.data,
      options: Joi.object().default({}),
    }).required(), params);
    const doc = cleanDocument({
      user,
      action,
      date,
      ip,
      ua,
      data,
    });
    return this.insertOne({ doc, options });
  }
}
