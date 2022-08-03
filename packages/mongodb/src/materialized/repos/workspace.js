import { BaseMaterializedRepo } from './-base.js';

export class MaterializedWorkspaceRepo extends BaseMaterializedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({
      client,
      entityType: 'workspace',
      indexes: [
      ],
    });
  }
}
