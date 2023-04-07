import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { mongoClientProp } from '@parameter1/mongodb-prop-types';

import { UserNormalizationBuilder } from './builders/user.js';

const { array, object } = PropTypes;

const builders = new Map([
  ['user', UserNormalizationBuilder],
]);

/**
 * @typedef {import("@parameter1/mongodb-core").Collection} Collection
 * @typedef {import("@parameter1/mongodb-core").MongoClient} MongoClient
 */
export class Normalizer {
  /**
   *
   * @param {object} params
   * @param {MongoClient} params.mongo
   */
  constructor(params) {
    const { mongo } = attempt(params, object({
      mongo: mongoClientProp.required(),
    }).required());

    /** @type {MongoClient} */
    this.mongo = mongo;
    /** @type {Collection} */
    this.collection = mongo.db('sso').collection('event-store');
  }

  /**
   * Normalizes data from the event store collection based on the provided entity type and IDs
   *
   * @typedef EventStoreNormalizeParams
   * @property {Array} entityIds
   * @property {string} entityType
   *
   * @param {string} type The entity type to push events for
   * @param {EventStoreNormalizeParams} params
   * @returns {Promise<void>}
   */
  async normalize(params) {
    /** @type {EventStoreNormalizeParams} */
    const { entityIds, entityType } = await validateAsync(object({
      entityIds: array().items(eventProps.entityId).required(),
      entityType: eventProps.entityType.required(),
    }).required(), params);

    const pipeline = Normalizer.buildNormalizationPipeline({ entityIds, entityType });
    await this.collection.aggregate(pipeline).toArray();
  }

  /**
   * Builds the pipeline for normalizing the event store.
   *
   * @typedef BuildNormalizationPipelineParams
   * @property {Array} entityIds
   * @property {string} entityType
   *
   * @param {BuildNormalizationPipelineParams} params
   * @returns {object[]}
   */
  static buildNormalizationPipeline(params) {
    /** @type {BuildNormalizationPipelineParams} */
    const { entityIds, entityType } = attempt(params, object({
      entityIds: array().items(eventProps.entityId).required(),
      entityType: eventProps.entityType.required(),
    }).required());

    const builder = builders.get(entityType);
    const {
      mergeValuesStages = [],
      newRootMergeObjects = [],
      unsetFields = [],
      valueBranches = [],
    } = builder ? builder.get() : {};

    return [{
      $match: {
        ...(entityIds.length && { entityId: { $in: entityIds } }),
        entityType,
      },
    }, {
      $sort: Normalizer.getEventSort(),
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

              sync: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$$this.command', 'CREATE'] },
                      '$$this._sync',
                    ],
                  },
                  '$$this._sync',
                  '$$value.sync',
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
                      { $eq: ['$$this.command', 'DELETE'] },
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
              _normalized: '$$NOW',
              _sync: '$_.sync',
            },
            '$_.values',
            ...newRootMergeObjects,
          ],
        },
      },
    }, {
      $unset: [
        '_history._sync',
        '_history.entityId',
        '_history.omitFromHistory',
        '_history.omitFromModified',
        ...unsetFields,
      ],
    }, {
      $merge: {
        into: { db: 'sso', coll: `${entityType}/normalized` },
        on: '_id',
        whenMatched: 'replace',
        whenNotMatched: 'insert',
      },
    }];
  }

  /**
   * Gets the event store sort order.
   *
   * @returns {object}
   */
  static getEventSort() {
    return { entityId: 1, date: 1, _id: 1 };
  }
}
