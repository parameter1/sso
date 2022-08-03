import { BaseBuilder } from './-base.js';
import { fullWorkspace } from './-projections.js';

export class WorkspaceBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'workspace' });
  }

  static buildPipelineStages() {
    const stages = [];
    stages.push({ $project: fullWorkspace() });
    return stages;
  }
}
