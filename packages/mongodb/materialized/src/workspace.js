import { MaterializedRepo } from './-root.js';

export class MaterializedWorkspaceRepo extends MaterializedRepo {
  /**
   * @param {import("./-root").MaterializedRepoConstructorParams} params
   */
  constructor(params) {
    super({
      ...params,
      entityType: 'workspace',
      indexes: [
        { key: { '_connection.member.edges.node._id': 1 } },
        { key: { '_edge.organization.node._id': 1, '_edge.application.node._id': 1, key: 1 } },
        { key: { '_edge.application.node._id': 1 } },

        { key: { path: 1, _id: 1 } },
      ],
    });
  }
}
