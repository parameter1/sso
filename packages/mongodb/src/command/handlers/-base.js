import { ObjectId } from '@parameter1/mongodb';
import { PropTypes, attempt, validateAsync } from '@parameter1/prop-types';

import { EventStore, eventProps } from '../event-store.js';
import { ReservationsRepo, reservationProps } from '../reservations.js';

const {
  boolean,
  func,
  object,
  oneOrMany,
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
  values: eventProps.values.default({}),
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

    const cursor = await this.store.aggregate({ pipeline });
    const docs = await cursor.toArray();
    return docs.reduce((map, doc) => {
      map.set(`${doc._id}`, doc.state);
      return map;
    }, new Map());
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
}
