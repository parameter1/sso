import { BaseNormalizedRepo } from './-base.js';

export class NormalizedApplicationRepo extends BaseNormalizedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({ client, entityType: 'application' });
  }
}
