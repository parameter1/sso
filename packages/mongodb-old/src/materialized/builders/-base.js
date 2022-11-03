import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';

import { DB_NAME } from '../../constants.js';
import { eventProps } from '../../command/event-store.js';

const { array, boolean, object } = PropTypes;

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

  buildMergeStage() {
    return {
      into: {
        db: DB_NAME,
        coll: `${this.entityType}/materialized`,
      },
      on: '_id',
      whenMatched: 'replace',
      whenNotMatched: 'insert',
    };
  }

  /**
   *
   * @param {object} params
   * @param {object} [params.$match={}]
   * @param {boolean} [params.withMergeStage=true]
   * @returns {Promise<object[]>}
   */
  buildPipeline(params) {
    const { $match, stages, withMergeStage } = attempt(params, object({
      $match: object().default({}),
      stages: array().items(object().required()).required(),
      withMergeStage: boolean().default(true),
    }).required());
    const pipeline = BaseBuilder.buildStartingStages({ $match });
    pipeline.push(...stages);
    if (withMergeStage) pipeline.push({ $merge: this.buildMergeStage() });
    return pipeline;
  }

  static buildStartingStages({ $match = {} } = {}) {
    return [
      { $match },
      { $sort: { _id: 1 } },
    ];
  }
}
