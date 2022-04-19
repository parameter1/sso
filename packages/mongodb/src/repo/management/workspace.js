import AbstractManagementRepo from './-abstract.js';
import { workspaceSchema } from '../../schema/index.js';

export default class WorkspaceRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'workspaces',
      collatableFields: [],
      indexes: [
        { key: { 'organization._id': 1, 'application._id': 1, key: 1 }, unique: true },

        { key: { 'application._id': 1 } },
      ],
      schema: workspaceSchema,
    });
  }
}
