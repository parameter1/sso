import { BaseNormalizedRepo } from './-base.js';

export class NormalizedManagerRepo extends BaseNormalizedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({
      client,
      entityType: 'manager',
      indexes: [
        { key: { '_id.user': 1, '_id.org': 1 } },
        { key: { '_id.org': 1 } },
      ],
    });
  }
}
