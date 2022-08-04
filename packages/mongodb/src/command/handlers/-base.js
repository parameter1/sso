import { ObjectId } from '@parameter1/mongodb';
import { PropTypes, attempt, validateAsync } from '@parameter1/prop-types';

import { DB_NAME } from '../../constants.js';
import { EventStore, eventProps } from '../event-store.js';
import { ReservationsRepo, reservationProps } from '../reservations.js';

const {
  array,
  boolean,
  func,
  object,
  oneOrMany,
  string,
} = PropTypes;

/**
 * @typedef CreateCommand
 * @property {*} [entityId]
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
 * @typedef DeleteCommand
 * @property {*} entityId
 * @property {Date|string} [date]
 * @property {ObjectId|null} [userId]
 */
const deleteSchema = object({
  entityId: eventProps.entityId.required(),
  date: eventProps.date,
  userId: eventProps.userId,
});

/**
 * @typedef RestoreCommand
 * @property {ObjectId} entityId
 * @property {Date|string} [date]
 * @property {object} [values={}]
 * @property {ObjectId|null} [userId]
 */
const restoreSchema = object({
  entityId: eventProps.entityId.required(),
  date: eventProps.date,
  values: eventProps.values.default({}),
  userId: eventProps.userId,
});

/**
 * @typedef ReserveValueCommand
 * @property {string} key
 * @property {*} value
 */
const reserveValueSchema = object({
  entityId: reservationProps.entityId.required(),
  key: reservationProps.key.required(),
  value: reservationProps.value.required(),
});

/**
 * @typedef UpdateCommand
 * @property {string} command
 * @property {*} entityId
 * @property {Date|string} [date]
 * @property {ObjectId|null} [userId]
 */
const updateSchema = object({
  command: eventProps.command.required(),
  entityId: eventProps.entityId.required(),
  date: eventProps.date,
  omitFromHistory: eventProps.omitFromHistory,
  omitFromModified: eventProps.omitFromModified,
  userId: eventProps.userId,
  values: eventProps.values.required(),
});

export class BaseCommandHandler {
  /**
   * @param {object} params
   * @param {string} params.entityType
   * @param {ReservationsRepo} params.reservations
   * @param {EventStore} params.store
   */
  constructor(params) {
    const {
      entityType,
      reservations,
      store,
    } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      reservations: object().instance(ReservationsRepo).required(),
      store: object().instance(EventStore).required(),
    }).required());
    this.client = store.client;
    this.reservations = reservations;
    this.store = store;
    this.entityType = entityType;
  }

  /**
   *
   * @param {object} params
   * @param {*|*[]} params.entityIds
   * @param {boolean} [params.withMergeStage=true]
   * @returns {Promise<object[]>}
   */
  buildNormalizationPipeline(params) {
    const {
      entityIds,
      newRootMergeObjects,
      unsetFields,
      valueBranches,
      withMergeStage,
    } = attempt(params, object({
      entityIds: oneOrMany(eventProps.entityId).required(),
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
   * @param {*|*[]} params.entityIds
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
   * @param {*|*[]} entityIds
   * @param {object} options
   * @param {boolean} options.throwWhenFalse
   */
  async canPushDelete(entityIds, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => ['CREATED', 'DELETED'].includes(state),
    });
  }

  /**
   *
   * @param {*|*[]} entityIds
   * @param {object} options
   * @param {boolean} options.throwWhenFalse
   */
  async canPushRestore(entityIds, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => state === 'DELETED',
    });
  }

  /**
   *
   * @param {*|*[]} entityIds
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
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async executeCreate(events, { session } = {}) {
    const prepared = await validateAsync(
      oneOrMany(createSchema).label('create command').required(),
      events,
    );
    return this.store.push(prepared.map((event) => ({
      ...event,
      entityType: this.entityType,
      command: 'CREATE',
    })), { session });
  }

  /**
   *
   * @param {DeleteCommand|DeleteCommand[]} commands
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async executeDelete(commands, { session } = {}) {
    const prepared = await validateAsync(
      oneOrMany(deleteSchema).label('delete command').required(),
      commands,
    );
    const { entityIds, events } = prepared.reduce((o, command) => {
      o.entityIds.push(command.entityId);
      o.events.push({ ...command, entityType: this.entityType, command: 'DELETE' });
      return o;
    }, { entityIds: [], events: [] });

    await this.canPushDelete(entityIds);
    return this.store.push(events, { session });
  }

  /**
   *
   * @param {RestoreCommand|RestoreCommand[]} commands
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async executeRestore(commands, { session } = {}) {
    const prepared = await validateAsync(
      oneOrMany(restoreSchema).label('restore command').required(),
      commands,
    );

    const { entityIds, events } = prepared.reduce((o, command) => {
      o.entityIds.push(command.entityId);
      o.events.push({ ...command, entityType: this.entityType, command: 'RESTORE' });
      return o;
    }, { entityIds: [], events: [] });

    await this.canPushRestore(entityIds);
    return this.store.push(events, { session });
  }

  /**
   *
   * @param {UpdateCommand|UpdateCommand[]} commands
   */
  async executeUpdate(commands) {
    const prepared = await validateAsync(
      oneOrMany(updateSchema).label('update command').required(),
      commands,
    );

    const { entityIds, events } = prepared.reduce((o, command) => {
      o.entityIds.push(command.entityId);
      o.events.push({ ...command, entityType: this.entityType });
      return o;
    }, { entityIds: [], events: [] });

    await this.canPushUpdate(entityIds);
    return this.store.push(events);
  }

  /**
   * Gets the state of a multiple entities by the provided IDs.
   *
   * @param {*[]} entityIds
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
   * @param {*|*[]} params.entityIds
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

  /**
   * Releases one or more reserved values for this entity type.
   *
   * @param {ReserveValueCommand|ReserveValueCommand[]} reservations
   */
  async release(reservations) {
    const prepared = await validateAsync(oneOrMany(reserveValueSchema).required(), reservations);
    return this.reservations.release(prepared.map((reservation) => ({
      ...reservation,
      entityType: this.entityType,
    })));
  }

  /**
   * Reserves one or more values for this entity type.
   *
   * @param {ReserveValueCommand|ReserveValueCommand[]} reservations
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async reserve(reservations, { session } = {}) {
    const prepared = await validateAsync(oneOrMany(reserveValueSchema).required(), reservations);
    return this.reservations.reserve(prepared.map((reservation) => ({
      ...reservation,
      entityType: this.entityType,
    })), { session });
  }

  static getEventSort() {
    return { entityId: 1, date: 1, _id: 1 };
  }
}
