import AbstractManagementRepo from './-abstract.js';
import { managerSchema } from '../../schema/index.js';

export default class ManagerRepo extends AbstractManagementRepo {
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
        { key: { 'user._id': 1, 'organization._id': 1 }, unique: true },
        { key: { 'organization._id': 1 } },
      ],
      schema: managerSchema,
    });
  }
}
