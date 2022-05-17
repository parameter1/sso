import { PipelinedRepo } from '@parameter1/mongodb';

import { userEventSchema } from '../../schema/index.js';

export default class UserEventRepo extends PipelinedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'user-events',
      indexes: [
        { key: { '_edge.user._id': 1, action: 1 } },

        { key: { date: 1, _id: 1 } },
      ],
      schema: userEventSchema,
    });
  }
}
