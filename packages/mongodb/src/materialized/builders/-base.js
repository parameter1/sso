import { PropTypes, attempt } from '@parameter1/prop-types';

import { eventProps } from '../../command/event-store.js';

const { object } = PropTypes;

export class BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor(params) {
    const {
      entityType,
    } = attempt(params, object({
      entityType: eventProps.entityType.required(),
    }).required());
    this.entityType = entityType;
  }

  // buildMergeStage() {
  //   return {
  //     into: {
  //       db: DB_NAME,
  //       coll: `${this.entityType}/materialized`,
  //     },
  //     on: '_id',
  //     whenMatched: 'replace',
  //     whenNotMatched: 'insert',
  //   };
  // }

  static buildStartingStages({ $match = {} } = {}) {
    return [
      { $match },
      { $sort: { _id: 1 } },
    ];
  }
}
