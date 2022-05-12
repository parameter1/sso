import AbstractManagementRepo from './-abstract.js';
import { userEventSchema } from '../../schema/index.js';

export default class UserEventRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'user-events',
      collatableFields: [],
      indexes: [
        { key: { 'user._id': 1, action: 1 } },

        { key: { date: 1, _id: 1 } },
      ],
      schema: userEventSchema,
    });
  }
}
