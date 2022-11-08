import { NormalizedRepo } from './-root.js';

export class NormalizedManagerRepo extends NormalizedRepo {
  /**
   * @param {import("./-root").NormalizedRepoConstructorParams} params
   */
  constructor(params) {
    super({
      ...params,
      entityType: 'manager',
      indexes: [
        { key: { '_id.user': 1, '_id.org': 1 } },
        { key: { '_id.org': 1 } },
      ],
    });
  }
}
