import { ManagedRepo } from '@parameter1/mongodb';

export default class MemberRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'members',
      collatableFields: [],
      indexes: [
        { key: { 'user._id': 1, 'workspace._id': 1 }, unique: true },
        { key: { 'workspace._id': 1 } },

        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }
}
