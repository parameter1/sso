import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  managerAttributes as managerAttrs,
  organizationAttributes as orgAttrs,
  userAttributes as userAttrs,
} from '../schema/attributes/index.js';

export default class ManagerRepo extends ManagedRepo {
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
        { key: { 'user._id': 1, 'org._id': 1 }, unique: true },
        { key: { 'org._id': 1 } },

        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }

  /**
   * @param {object} params
   * @param {object} params.user
   * @param {string|ObjectId} params.user._id
   * @param {string} params.user.email
   *
   * @param {object} params.org
   * @param {string|ObjectId} params.org._id
   * @param {string} params.org.slug
   * @param {string} params.org.name
   *
   * @param {string} params.role
   *
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      user,
      org,
      role,
      options,
    } = await validateAsync(Joi.object({
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email.required(),
      }).required(),
      org: Joi.object({
        _id: orgAttrs.id.required(),
        slug: orgAttrs.slug.required(),
        name: orgAttrs.name.required(),
      }).required(),
      role: managerAttrs.role.required(),
    }).required(), params);

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        user,
        org,
        role,
        date: { created: now, updated: now },
      }),
      options,
    });
  }
}
