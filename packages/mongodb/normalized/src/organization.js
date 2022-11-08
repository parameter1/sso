import { NormalizedRepo } from './-root.js';

export class NormalizedOrganizationRepo extends NormalizedRepo {
  /**
   * @param {import("./-root").NormalizedRepoConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'organization' });
  }
}
