import { PropTypes, attempt } from '@parameter1/sso-prop-types';

import { DB_NAME } from '../../constants.js';
import { eventProps, getEventSort } from '../../command/event-store.js';

const {
  array,
  boolean,
  object,
  oneOrMany,
  propTypeObject,
  string,
} = PropTypes;

export class BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {function} params.entityIdType
   * @param {string} params.entityType
   */
  constructor(params) {
    const {
      entityIdType,
      entityType,
    } = attempt(params, object({
      entityIdType: propTypeObject().required(),
      entityType: eventProps.entityType.required(),
    }).required());
    this.entityIdType = entityIdType;
    this.entityType = entityType;
  }

  buildMergeStage() {
    return {
      into: {
        db: DB_NAME,
        coll: `${this.entityType}/normalized`,
      },
      on: '_id',
      whenMatched: 'replace',
      whenNotMatched: 'insert',
    };
  }

  /**
   *
   * @param {object} params
   * @param {*|*[]} params.entityIds
   * @param {object[]} [params.mergeValuesStages=[]]
   * @param {object[]} [params.newRootMergeObjects=[]]
   * @param {string[]} [params.unsetFields=[]]
   * @param {object[]} [params.valueBranches=[]]
   * @param {boolean} [params.withMergeStage=true]
   * @returns {Promise<object[]>}
   */
  build(params) {
    const {
      entityIds,
      mergeValuesStages,
      newRootMergeObjects,
      unsetFields,
      valueBranches,
      withMergeStage,
    } = attempt(params, object({
      entityIds: oneOrMany(this.entityIdType).required(),
      mergeValuesStages: array().items(object()).default([]),
      newRootMergeObjects: array().items(object()).default([]),
      unsetFields: array().items(string()).default([]),
      valueBranches: array().items(object()).default([]),
      withMergeStage: boolean().default(true),
    }).required());

    const pipeline = [{
      $match: {
        ...(entityIds.length && { entityId: { $in: entityIds } }),
        entityType: this.entityType,
      },
    }, {
      $sort: getEventSort(),
    }, {
      $group: { _id: '$entityId', stream: { $push: '$$ROOT' } },
    }, {
      $set: {
        _: {
          $reduce: {
            input: '$stream',
            initialValue: {},
            in: {
              isDeleted: {
                $cond: [
                  { $eq: ['$$this.command', 'DELETE'] },
                  true,
                  {
                    $cond: [
                      { $eq: ['$$this.command', 'RESTORE'] },
                      false,
                      { $ifNull: ['$$value.isDeleted', false] },
                    ],
                  },
                ],
              },

              created: {
                $ifNull: [
                  {
                    $cond: [
                      { $eq: ['$$this.command', 'CREATE'] },
                      { date: '$$this.date', userId: '$$this.userId' },
                      null,
                    ],
                  },
                  '$$value.created',
                ],
              },

              modified: {
                $cond: [
                  { $eq: ['$$this.omitFromModified', true] },
                  '$$value.modified',
                  {
                    date: '$$this.date',
                    n: { $add: [{ $ifNull: ['$$value.modified.n', 0] }, 1] },
                    userId: '$$this.userId',
                  },
                ],
              },

              touched: {
                date: '$$this.date',
                n: { $add: [{ $ifNull: ['$$value.touched.n', 0] }, 1] },
                userId: '$$this.userId',
              },

              values: {
                $mergeObjects: [
                  '$$value.values',
                  {
                    $cond: [
                      { $eq: ['$$this.command', 'DELETED'] },
                      {},
                      valueBranches.length ? {
                        $switch: {
                          branches: valueBranches,
                          default: '$$this.values',
                        },
                      } : '$$this.values',
                    ],
                  },
                  ...mergeValuesStages,
                ],
              },
            },
          },
        },
      },
    }, {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            { _id: '$_id' },
            {
              _deleted: '$_.isDeleted',
              _history: { $filter: { input: '$stream', cond: { $ne: ['$$this.omitFromHistory', true] } } },
              _meta: { created: '$_.created', modified: '$_.modified', touched: '$_.touched' },
            },
            '$_.values',
            ...newRootMergeObjects,
          ],
        },
      },
    }, {
      $unset: [
        '_history.entityId',
        '_history.omitFromHistory',
        '_history.omitFromModified',
        ...unsetFields,
      ],
    }];
    if (withMergeStage) pipeline.push({ $merge: this.buildMergeStage() });
    return pipeline;
  }
}
