import { NormalizedRepo } from './-root.js';

export class NormalizedApplicationRepo extends NormalizedRepo {
  /**
   * @param {import("./-root").NormalizedRepoConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'application' });
  }
}
