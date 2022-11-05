import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { DB_NAME, EJSON, mongoDBClientProp } from '@parameter1/sso-mongodb-core';
import { UserNormalizationBuilder } from './normalization-builders/user.js';

const { array, object } = PropTypes;

/**
 * @typedef {import("./index").EventStoreResult} EventStoreResult
 * @typedef {import("./index").EventStoreDocument} EventStoreDocument
 *
 * @typedef EventStoreConstructorParams
 * @property {import("mongodb").MongoClient} mongo The MongoDB client
 */
export class EventStore {
  /**
   *
   * @param {EventStoreConstructorParams} params
   */
  constructor(params) {
    /** @type {EventStoreConstructorParams} */
    const { mongo } = attempt(params, object({
      mongo: mongoDBClientProp.required(),
    }).required());

    /** @type {import("mongodb").MongoClient} */
    this.mongo = mongo;

    /** @type {import("mongodb").Collection} */
    this.collection = mongo.db(DB_NAME).collection('event-store');

    /**
     * @type {Map<string, UserNormalizationBuilder>}
     */
    this.normalizedBuilders = new Map([
      ['user', UserNormalizationBuilder],
    ]);
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
  buildNormalizationPipeline(params) {
    /** @type {BuildNormalizationPipelineParams} */
    const { entityIds, entityType } = attempt(params, object({
      entityIds: array().items(eventProps.entityId).required(),
      entityType: eventProps.entityType.required(),
    }).required());

    const builder = this.normalizedBuilders.get(entityType);
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
      $sort: EventStore.getEventSort(),
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
              _normalized: '$$NOW',
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
    }, {
      $merge: {
        into: { db: DB_NAME, coll: `${entityType}/normalized` },
        on: '_id',
        whenMatched: 'replace',
        whenNotMatched: 'insert',
      },
    }];
  }

  /**
   * Creates the database indexes for this store.
   *
   * @returns {Promise<string[]>}
   */
  async createIndexes() {
    return this.collection.createIndexes([
      { key: { entityId: 1, date: 1, _id: 1 } },
      { key: { entityId: 1, entityType: 1, command: 1 } },
      { key: { entityId: 1, entityType: 1 }, unique: true, partialFilterExpression: { command: 'CREATE' } },
    ]);
  }

  /**
   * Gets the entity state for the provided entity IDs.
   *
   * @typedef GetEntityStatesForParams
   * @property {Array} entityIds
   * @property {string} entityType
   *
   * @param {GetEntityStatesForParams} params
   * @returns {Promise<Map<string, string>>}
   */
  async getEntityStatesFor(params) {
    /** @type {GetEntityStatesForParams} */
    const { entityIds, entityType } = await validateAsync(object({
      entityIds: array().items(eventProps.entityId.required()).required(),
      entityType: eventProps.entityType.required(),
    }).required().label('eventStore.getEntityStatesFor'), params);

    const pipeline = [{
      $match: {
        entityId: { $in: entityIds },
        entityType,
        command: { $in: ['CREATE', 'DELETE', 'RESTORE'] },
      },
    }, {
      $sort: EventStore.getEventSort(),
    }, {
      $group: { _id: '$entityId', first: { $first: '$command' }, last: { $last: '$command' } },
    }, {
      $match: { first: 'CREATE' },
    }, {
      $project: {
        state: { $cond: [{ $eq: ['$last', 'DELETE'] }, 'DELETED', 'CREATED'] },
      },
    }];

    const docs = await this.collection.aggregate(pipeline).toArray();
    return docs.reduce((map, doc) => {
      map.set(EJSON.stringify(doc._id), doc.state);
      return map;
    }, new Map());
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
    }).required().label('eventStore.normalize'), params);

    const pipeline = this.buildNormalizationPipeline({ entityIds, entityType });
    await this.collection.aggregate(pipeline).toArray();
  }

  /**
   * Pushes and persists one or more events to the store.
   *
   * @typedef PushParams
   * @property {EventStoreDocument[]} events
   * @property {import("mongodb").ClientSession} [session]
   *
   * @param {PushParams} params The push parameters
   * @returns {Promise<EventStoreResult[]>}
   */
  async push(params) {
    /** @type {PushParams} */
    const { events, session } = await validateAsync(object({
      events: array().items(object({
        command: eventProps.command.required(),
        entityId: eventProps.entityId.required(),
        entityType: eventProps.entityType.required(),
        date: eventProps.date.default('$$NOW'),
        omitFromHistory: eventProps.omitFromHistory.default(false),
        omitFromModified: eventProps.omitFromModified.default(false),
        values: eventProps.values.default({}),
        userId: eventProps.userId.default(null),
      })).required(),
      session: object(),
    }).required().label('eventStore.push'), params);

    const objs = [];
    const operations = [];
    events.forEach((event) => {
      const prepared = { ...event, values: { $literal: event.values } };
      objs.push(prepared);
      operations.push({
        updateOne: {
          filter: { _id: { $lt: 0 } },
          update: [{ $replaceRoot: { newRoot: { $mergeObjects: [prepared, '$$ROOT'] } } }],
          upsert: true,
        },
      });
    });

    const { result } = await this.collection.bulkWrite(operations, { session });
    return result.upserted.map(({ _id, index }) => {
      const o = objs[index];
      return {
        _id,
        command: o.command,
        entityId: o.entityId,
        entityType: o.entityType,
        userId: o.userId,
        values: o.values.$literal || {},
      };
    });
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
