import { NormalizedRepo } from './-root.js';

export class NormalizedMemberRepo extends NormalizedRepo {
  /**
   * @param {import("./-root").NormalizedRepoConstructorParams} params
   */
  constructor(params) {
    super({
      ...params,
      entityType: 'member',
      indexes: [
        { key: { '_id.user': 1, '_id.workspace': 1 } },
        { key: { '_id.workspace': 1 } },
      ],
    });
  }
}
