import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';

import { BaseBuilder } from './-base.js';
import workspaceCommandProps from '../../command/props/workspace.js';

const { boolean, object, oneOrMany } = PropTypes;

export class WorkspaceBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'workspace', entityIdType: workspaceCommandProps.id });
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
