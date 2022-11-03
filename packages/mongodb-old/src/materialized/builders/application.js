import { BaseBuilder } from './-base.js';
import { fullApplication } from './-projections.js';

export class ApplicationBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'application' });
  }

  static buildPipelineStages() {
    const stages = [];
    stages.push({ $project: fullApplication() });
    return stages;
  }
}
