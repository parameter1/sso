import { BaseNormalizedRepo } from './-base.js';

export class NormalizedOrganizationRepo extends BaseNormalizedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({ client, entityType: 'organization' });
  }
}
