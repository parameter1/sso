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
    super({ client, entityType: 'user' });
  }

  /**
   * Finds a single user by email address.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {object} [params.options]
   */
  findByEmail(params) {
    const { email, options } = validateAsync(object({
      email: userProps.email.required(),
      options: object(),
    }).required(), params);
    return this.findOne({ query: { email }, options });
  }
}
