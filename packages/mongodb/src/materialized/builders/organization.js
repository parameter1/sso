import { BaseBuilder } from './-base.js';
import { fullOrganization } from './-projections.js';

export class OrganizationBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'organization' });
  }

  static buildPipelineStages() {
    const stages = [];
    stages.push({ $project: fullOrganization() });
    return stages;
  }
}
