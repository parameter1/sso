import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';

const { array, object } = PropTypes;

export class PipelineBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor(params) {
    const { entityType } = attempt(params, object({
      entityType: eventProps.entityType.required(),
    }).required());
    this.entityType = entityType;
  }

  /**
   *
   * @param {object} params
   * @param {object} [params.$match={}]
   * @param {object[]} params.stages
   * @returns {object[]}
   */
  build(params) {
    const { $match, stages } = attempt(params, object({
      $match: object().default({}),
      stages: array().items(object().required()).required(),
    }).required());
    const pipeline = [
      { $match },
      { $sort: { _id: 1 } },
    ];
    pipeline.push(...stages);
    pipeline.push({
      $merge: {
        into: { db: 'sso', coll: `${this.entityType}/materialized` },
        on: '_id',
        whenMatched: 'replace',
        whenNotMatched: 'insert',
      },
    });
    return pipeline;
  }

  /**
   *
   * @param {object} [$match]
   * @returns {object[]}
   */
  buildPipeline() {
    throw new Error(`The buildPipeline method has not been implemented for type '${this.entityType}'`);
  }
}
