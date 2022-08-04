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
        { key: { '_edge.organization.node._id': 1, '_edge.application.node._id': 1, key: 1 } },
        { key: { '_edge.application.node._id': 1 } },

        { key: { path: 1, _id: 1 } },
      ],
    });
  }
}
