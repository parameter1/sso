import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';

import { MaterializedRepo } from './-root.js';

const { boolean, email: emailPropType, object } = PropTypes;

export class MaterializedUserRepo extends MaterializedRepo {
  /**
   * @param {import("./-root").MaterializedRepoConstructorParams} params
   */
  constructor(params) {
    super({
      ...params,
      entityType: 'user',
      indexes: [
        { key: { '_connection.organization.edges.node._id': 1 } },

        { key: { email: 1, _id: 1 } },
        { key: { 'slug.default': 1, _id: 1 } },
        { key: { 'slug.reverse': 1, _id: 1 } },
      ],
    });
  }

  /**
   * Finds a single user by email address.
   *
   * @typedef {import("mongodb").Document} Document
   *
   * @typedef MaterializedUserRepoFindByEmailParams
   * @property {string} email
   * @property {boolean} [suppressDeleted=true]
   * @property {import("mongodb").FindOptions} [options]
   *
   * @param {MaterializedUserRepoFindByEmailParams} params
   * @returns {Promise<Document|null>}
   */
  async findByEmail(params) {
    /** @type {MaterializedUserRepoFindByEmailParams} */
    const { suppressDeleted, email, options } = await validateAsync(object({
      email: emailPropType().required(),
      options: object(),
      suppressDeleted: boolean().default(true),
    }).required(), params);

    return this.collection.findOne({
      email,
      ...(suppressDeleted && { _deleted: false }),
    }, options);
  }
}
