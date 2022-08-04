import { PropTypes, validateAsync } from '@parameter1/prop-types';
import userProps from '../../command/props/user.js';
import { BaseMaterializedRepo } from './-base.js';

const { object } = PropTypes;

export class MaterializedUserRepo extends BaseMaterializedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({
      client,
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
   * @param {object} params
   * @param {string} params.email
   * @param {object} [params.options]
   */
  async findByEmail(params) {
    const { email, options } = await validateAsync(object({
      email: userProps.email.required(),
      options: object(),
    }).required(), params);
    return this.findOne({ query: { email }, options });
  }
}
