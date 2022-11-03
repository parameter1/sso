import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';

import { BaseBuilder } from './-base.js';
import organizationCommandProps from '../../command/props/organization.js';

const { boolean, object, oneOrMany } = PropTypes;

export class OrganizationBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'organization', entityIdType: organizationCommandProps.id });
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
