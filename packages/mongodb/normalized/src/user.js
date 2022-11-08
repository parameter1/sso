import { NormalizedRepo } from './-root.js';

export class NormalizedUserRepo extends NormalizedRepo {
  /**
   * @param {import("./-root").NormalizedRepoConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'user' });
  }
}
