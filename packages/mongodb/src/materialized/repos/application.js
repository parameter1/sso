import { BaseMaterializedRepo } from './-base.js';

export class MaterializedApplicationRepo extends BaseMaterializedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({ client, entityType: 'application' });
  }
}
