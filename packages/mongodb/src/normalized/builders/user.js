import { PropTypes, attempt } from '@parameter1/sso-prop-types';

import { BaseBuilder } from './-base.js';
import userCommandProps from '../../command/props/user.js';

const { boolean, object, oneOrMany } = PropTypes;

export class UserBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'user', entityIdType: userCommandProps.id });
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

    return this.build({
      entityIds,
      withMergeStage,
      valueBranches: [{
        case: { $eq: ['$$this.command', 'MAGIC_LOGIN'] },
        then: {
          lastLoggedInAt: '$$this.date',
          loginCount: { $add: [{ $ifNull: ['$$value.values.loginCount', 0] }, 1] },
          verified: true,
        },
      }],
      mergeValuesStages: [{
        previousEmails: {
          $setUnion: [
            { $cond: [{ $isArray: '$$value.values.previousEmails' }, '$$value.values.previousEmails', []] },
            { $cond: ['$$this.values.email', ['$$this.values.email'], []] },
          ],
        },
      }],
      newRootMergeObjects: [{
        previousEmails: {
          $filter: { input: '$_.values.previousEmails', cond: { $ne: ['$$this', '$_.values.email'] } },
        },
      }],
    });
  }
}
