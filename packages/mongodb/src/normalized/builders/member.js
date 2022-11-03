import { PropTypes, attempt } from '@parameter1/sso-prop-types';

import { BaseBuilder } from './-base.js';
import memberCommandProps from '../../command/props/member.js';

const { boolean, object, oneOrMany } = PropTypes;

export class MemberBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'member', entityIdType: memberCommandProps.id });
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
