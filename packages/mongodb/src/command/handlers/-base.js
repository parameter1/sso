import { ObjectId } from '@parameter1/mongodb';
import { PropTypes, attempt, validateAsync } from '@parameter1/prop-types';

import { DB_NAME } from '../../constants.js';
import { EventStore, eventProps } from '../event-store.js';

const {
  boolean,
  func,
  object,
  oneOrMany,
} = PropTypes;

/**
 * @typedef CreateCommand
 * @property {ObjectId} [entityId]
 * @property {Date|string} [date]
 * @property {object} [values]
 * @property {ObjectId|null} [userId]
 */
const createSchema = object({
  entityId: eventProps.entityId.default(() => new ObjectId()),
  date: eventProps.date,
  values: eventProps.values.required(),
  userId: eventProps.userId,
});

/**
 * @typedef UpdateCommand
 * @property {string} command
 * @property {ObjectId} entityId
 * @property {Date|string} [date]
 * @property {ObjectId|null} [userId]
 */
const updateSchema = object({
  command: eventProps.command.required(),
  entityId: eventProps.entityId.required(),
  date: eventProps.date,
  userId: eventProps.userId,
  values: eventProps.values.required(),
});

export class BaseCommandHandler {
  /**
   * @param {object} params
   * @param {string} params.entityType
   * @param {EventStore} params.store
   */
  constructor(params) {
    const {
      entityType,
      store,
    } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      store: object().instance(EventStore).required(),
    }).required());
    this.store = store;
    this.entityType = entityType;
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId|ObjectId[]} params.entityIds
   * @param {boolean} [params.withMergeStage=true]
   * @returns {Promise<object[]>}
   */
  buildNormalizationPipeline(params) {
    const { entityIds, withMergeStage } = attempt(params, object({
      entityIds: oneOrMany(eventProps.entityId).required(),
      withMergeStage: boolean().default(true),
    }).required());

    const pipeline = [{
      $match: { entityId: { $in: entityIds }, entityType: this.entityType },
    }, {
      $sort: BaseCommandHandler.getEventSort(),
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
                      { $in: ['$$this.command', ['DELETED', 'RESTORED']] },
                      {},
                      '$$this.values',
                    ],
                  },
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
              __: {
                created: '$_.created',
                history: '$stream',
                isDeleted: '$_.isDeleted',
                modified: '$_.modified',
                touched: '$_.touched',
              },
            },
            '$_.values',
          ],
        },
      },
    }, {
      $unset: ['__.history.entityId', '__.history.omitFromModified'],
    }];
    if (withMergeStage) {
      pipeline.push({
        $merge: {
          into: { db: DB_NAME, coll: `${this.entityType}/normalized` },
          on: '_id',
          whenMatched: 'replace',
          whenNotMatched: 'insert',
        },
      });
    }
    return pipeline;
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId|ObjectId[]} params.entityIds
   * @param {function} params.eligibleWhenFn
   * @param {boolean} [options.throwWhenFalse=true]
   */
  async canPush(params) {
    const {
      entityIds,
      eligibleWhenFn,
      throwWhenFalse,
    } = await validateAsync(object({
      entityIds: oneOrMany(eventProps.entityId).required(),
      eligibleWhenFn: func().required(),
      throwWhenFalse: boolean().default(true),
    }).required(), params);

    const states = await this.getEntityStatesFor(entityIds);
    const ineligible = entityIds.reduce((set, entityId) => {
      const id = `${entityId}`;
      const state = states.get(id);
      const eligible = eligibleWhenFn({ state });
      if (!eligible) set.add(id);
      return set;
    }, new Set());

    const canPush = !ineligible.size;
    if (!throwWhenFalse) return canPush;
    if (!canPush) {
      const error = new Error(`Unable to execute command: no eligible ${this.entityType} entities were found for ${[...ineligible].join(', ')}.`);
      error.statusCode = 404;
      throw error;
    }
    return true;
  }

  /**
   *
   * @param {ObjectId|ObjectId[]} entityIds
   * @param {object} options
   * @param {boolean} [options.throwWhenFalse]
   */
  async canPushUpdate(entityIds, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => state === 'CREATED',
    });
  }

  /**
   *
   * @param {CreateCommand|CreateCommand[]} events
   */
  async executeCreate(events) {
    const prepared = await validateAsync(
      oneOrMany(createSchema).label('create command').required(),
      events,
    );
    return this.store.push(prepared.map((event) => ({
      ...event,
      entityType: this.entityType,
      command: 'CREATE',
    })));
  }

  /**
   *
   * @param {UpdateCommand|UpdateCommand[]} events
   */
  async executeUpdate(events) {
    const prepared = await validateAsync(
      oneOrMany(updateSchema).label('update command').required(),
      events,
    );

    const { entityIds, toPush } = prepared.reduce((o, event) => {
      o.entityIds.push(event.entityId);
      o.toPush.push({ ...event, entityType: this.entityType });
      return o;
    }, { entityIds: [], toPush: [] });

    await this.canPushUpdate(entityIds);
    return this.eventStore.push(toPush);
  }

  /**
   * Gets the state of a multiple entities by the provided IDs.
   *
   * @param {ObjectId[]} entityIds
   * @returns {Promise<Map<string, string>>}
   */
  async getEntityStatesFor(entityIds) {
    const pipeline = [{
      $match: {
        entityId: { $in: entityIds },
        entityType: this.entityType,
        command: { $in: ['CREATE', 'DELETE', 'RESTORE'] },
      },
    }, {
      $sort: BaseCommandHandler.getEventSort(),
    }, {
      $group: { _id: '$entityId', first: { $first: '$command' }, last: { $last: '$command' } },
    }, {
      $match: { first: 'CREATE' },
    }, {
      $project: {
        state: { $cond: [{ $eq: ['$last', 'DELETE'] }, 'DELETED', 'CREATED'] },
      },
    }];

    const cursor = await this.store.aggregate({ pipeline });
    const docs = await cursor.toArray();
    return docs.reduce((map, doc) => {
      map.set(`${doc._id}`, doc.state);
      return map;
    }, new Map());
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId|ObjectId[]} params.entityIds
   * @param {boolean} [params.withMergeStage=true]
   * @returns {Promise<object[]>}
   */
  async normalize(params) {
    const {
      entityIds,
      withMergeStage,
    } = await validateAsync(object({
      entityIds: oneOrMany(eventProps.entityId).required(),
      withMergeStage: boolean().default(true),
    }).required(), params);

    const pipeline = this.buildNormalizationPipeline({ entityIds, withMergeStage });
    const cursor = await this.store.aggregate({ pipeline });
    return cursor.toArray();
  }

  static getEventSort() {
    return { entityId: 1, date: 1, _id: 1 };
  }
}
