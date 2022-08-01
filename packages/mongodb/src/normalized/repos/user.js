import { BaseNormalizedRepo } from './-base.js';

export class NormalizedUserRepo extends BaseNormalizedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({ client, entityType: 'user' });
  }
}
