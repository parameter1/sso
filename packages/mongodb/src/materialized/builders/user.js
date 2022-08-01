import { BaseBuilder } from './-base.js';
import { fullUser } from './-projections.js';

export class UserBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'user' });
  }

  static buildPipelineStages() {
    const stages = [];
    stages.push({ $project: fullUser() });
    return stages;
  }
}
