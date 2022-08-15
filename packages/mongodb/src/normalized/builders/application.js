import { PropTypes, attempt } from '@parameter1/prop-types';

import { BaseBuilder } from './-base.js';
import applicationCommandProps from '../../command/props/application.js';

const { boolean, object, oneOrMany } = PropTypes;

export class ApplicationBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'application', entityIdType: applicationCommandProps.id });
  }

  /**
   *
   * @param {object} params
   * @param {*|*[]} [params.entityIds=[]]
   * @param {boolean} [params.withMergeStage=true]
   */
  buildPipeline(params) {
    const { entityIds, withMergeStage } = attempt(params, object({
      entityIds: oneOrMany(this.entityIdType).required(),
      withMergeStage: boolean().default(true),
    }).required());
    return this.build({ entityIds, withMergeStage });
  }
}
