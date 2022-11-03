import { BaseNormalizedRepo } from './-base.js';

export class NormalizedMemberRepo extends BaseNormalizedRepo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor({ client }) {
    super({
      client,
      entityType: 'member',
      indexes: [
        { key: { '_id.user': 1, '_id.workspace': 1 } },
        { key: { '_id.workspace': 1 } },
      ],
    });
  }
}
