import { PipelineBuilder } from './-root.js';
import { fullApplication } from './-projections.js';

export class ApplicationPipelineBuilder extends PipelineBuilder {
  constructor() {
    super({ entityType: 'application' });
  }

  /**
   *
   * @param {object} [$match]
   * @returns {object[]}
   */
  buildPipeline($match) {
    const stages = [];
    stages.push({ $project: fullApplication() });
    return this.build({ $match, stages });
  }
}
