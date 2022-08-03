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
        { key: { 'organizationEdge.node._id': 1, 'applicationEdge.node._id': 1, key: 1 } },
        { key: { 'applicationEdge.node._id': 1 } },
      ],
    });
  }
}
