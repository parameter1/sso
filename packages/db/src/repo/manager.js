import { ManagedRepo } from '@parameter1/mongodb';

export default class ManagerRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'managers',
      collatableFields: [],
      indexes: [
        { key: { 'user._id': 1, 'org._id': 1 }, unique: true },
        { key: { 'org._id': 1 } },

        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }
}
