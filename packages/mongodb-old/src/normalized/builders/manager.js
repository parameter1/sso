import { PropTypes, attempt } from '@parameter1/sso-prop-types';

import { BaseBuilder } from './-base.js';
import managerCommandProps from '../../command/props/manager.js';

const { boolean, object, oneOrMany } = PropTypes;

export class ManagerBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'manager', entityIdType: managerCommandProps.id });
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
