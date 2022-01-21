import { ManagedRepo } from '@parameter1/mongodb';

export default class WorkspaceRepo extends ManagedRepo {
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
        { key: { 'instance._id': 1, slug: 1 }, unique: true },
        { key: { slug: 1 } },

        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }
}
