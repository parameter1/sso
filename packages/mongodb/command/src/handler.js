import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { EJSON, mongoSessionProp } from '@parameter1/sso-mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { SQSClient, enqueueMessages } from '@parameter1/sso-sqs';
import { Reservations } from './reservations.js';
import { reservationProps } from './props.js';

const {
  array,
  boolean,
  func,
  object,
  url,
} = PropTypes;

/**
 * @typedef {import("mongodb").ClientSession} ClientSession
 * @typedef {import("./types").EventStoreResult} EventStoreResult
 * @typedef {import("./types").ReservationsReleaseParams} ReservationsReleaseParams
 * @typedef {import("./types").ReservationsReserveParams} ReservationsReserveParams
 *
 *
 * @typedef CommandHandlerConstructorParams
 * @property {string} entityType
 * @property {Reservations} reservations
 * @property {EventStore} store
 * @property {CommandHandlerConstructorParamsSQS} sqs
 *
 * @typedef CommandHandlerConstructorParamsSQS
 * @property {SQSClient} client
 * @property {string} url
 *
 * @typedef {import("@parameter1/sso-mongodb-event-store").EventStoreDocument} EventStoreDocument
 */
export class CommandHandler {
  /**
   *
   * @param {CommandHandlerConstructorParams} params
   */
  constructor(params) {
    /** @type {CommandHandlerConstructorParams} */
    const { reservations, store, sqs } = attempt(params, object({
      // entityType: eventProps.entityType.required(),
      reservations: object().instance(Reservations).required(),
      sqs: object({
        client: object().instance(SQSClient).required(),
        url: url().required(),
      }).required(),
      store: object().instance(EventStore).required(),
    }).required());

    /** @type {Reservations} */
    this.reservations = reservations;
    /** @type {CommandHandlerConstructorParamsSQS} */
    this.sqs = sqs;
    /** @type {EventStore} */
    this.store = store;
  }

  /**
   * @typedef CanPushParams
   * @property {Array} entityIds
   * @property {string} entityType
   * @property {function} eligibleWhenFn
   * @property {boolean} [throwWhenFalse=true]
   *
   * @param {CanPushParams} params
   */
  async canPush(params) {
    /** @type {CanPushParams} */
    const {
      entityIds,
      entityType,
      eligibleWhenFn,
      throwWhenFalse,
    } = await validateAsync(object({
      entityIds: array.items(eventProps.entityId.required()).required(),
      entityType: eventProps.entityType.required(),
      eligibleWhenFn: func().required(),
      throwWhenFalse: boolean().default(true),
    }).required().label('handler.canPush'), params);

    const states = await this.getEntityStatesFor({ entityIds, entityType });
    const ineligible = entityIds.reduce((set, entityId) => {
      const id = EJSON.stringify(entityId);
      const state = states.get(id);
      const eligible = eligibleWhenFn({ state });
      if (!eligible) set.add(id);
      return set;
    }, new Set());

    const canPush = !ineligible.size;
    if (!throwWhenFalse) return canPush;
    if (!canPush) {
      const error = new Error(`Unable to execute command: no eligible ${entityType} entities were found for ${[...ineligible].join(', ')}.`);
      error.statusCode = 404;
      throw error;
    }
    return true;
  }

  /**
   *
   * @param {Array} entityIds
   * @param {string} entityType
   * @param {object} options
   * @param {boolean} options.throwWhenFalse
   * @returns {Promise<boolean>}
   */
  async canPushDelete({ entityIds, entityType }, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      entityType,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => state === 'CREATED',
    });
  }

  /**
   *
   * @param {Array} entityIds
   * @param {string} entityType
   * @param {object} options
   * @param {boolean} options.throwWhenFalse
   * @returns {Promise<boolean>}
   */
  async canPushRestore({ entityIds, entityType }, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      entityType,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => state === 'DELETED',
    });
  }

  /**
   *
   * @param {Array} entityIds
   * @param {string} entityType
   * @param {object} options
   * @param {boolean} [options.throwWhenFalse]
   * @returns {Promise<boolean>}
   */
  async canPushUpdate({ entityIds, entityType }, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      entityType,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => state === 'CREATED',
    });
  }

  async createIndexes() {
    return new Map(await Promise.all([
      (async () => {
        const r = await this.store.createIndexes();
        return ['store', r];
      })(),
      (async () => {
        const r = await this.reservations.createIndexes();
        return ['reservations', r];
      })(),
    ]));
  }

  /**
   * @typedef ExecuteCreateParams
   * @property {string} entityType
   * @property {ExecuteCreateParamsInput[]} input
   * @property {ClientSession} [session]
   *
   * @typedef ExecuteCreateParamsInput
   * @property {Date|string} [date]
   * @property {*} entityId
   * @property {ObjectId|null} [userId]
   * @property {object} [values]
   *
   * @param {ExecuteCreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async executeCreate(params) {
    /** @type {ExecuteCreateParams} */
    const { entityType, input, session } = await validateAsync(object({
      entityType: eventProps.entityType.required(),
      input: array().items(object({
        date: eventProps.date,
        entityId: eventProps.entityId.required(),
        userId: eventProps.userId,
        values: eventProps.values.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.executeCreate'), params);

    return this.pushToStore({
      events: input.map((event) => ({
        ...event,
        entityType,
        command: 'CREATE',
      })),
      session,
    });
  }

  /**
   * @typedef ExecuteDeleteParams
   * @property {string} entityType
   * @property {ExecuteDeleteParamsInput[]} input
   * @property {ClientSession} [session]
   *
   * @typedef ExecuteDeleteParamsInput
   * @property {Date|string} [date]
   * @property {*} entityId
   * @property {ObjectId|null} [userId]
   *
   * @param {ExecuteDeleteParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async executeDelete(params) {
    /** @type {ExecuteDeleteParams} */
    const { entityType, input, session } = await validateAsync(object({
      entityType: eventProps.entityType.required(),
      input: array().items(object({
        date: eventProps.date,
        entityId: eventProps.entityId.required(),
        userId: eventProps.userId,
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.executeDelete'), params);

    const { entityIds, events } = input.reduce((o, command) => {
      o.entityIds.push(command.entityId);
      o.events.push({ ...command, entityType, command: 'DELETE' });
      return o;
    }, { entityIds: [], events: [] });

    await this.canPushDelete({ entityType, entityIds });
    return this.pushToStore({ events, session });
  }

  /**
   * @typedef ExecuteRestoreParams
   * @property {string} entityType
   * @property {ExecuteRestoreParamsInput[]} input
   * @property {ClientSession} [session]
   *
   * @typedef ExecuteRestoreParamsInput
   * @property {Date|string} [date]
   * @property {*} entityId
   * @property {ObjectId|null} [userId]
   * @property {object} [values]
   *
   * @param {ExecuteRestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async executeRestore(params) {
    /** @type {ExecuteRestoreParams} */
    const { entityType, input, session } = await validateAsync(object({
      entityType: eventProps.entityType.required(),
      input: array().items(object({
        date: eventProps.date,
        entityId: eventProps.entityId.required(),
        userId: eventProps.userId,
        values: eventProps.values.default({}),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.executeRestore'), params);

    const { entityIds, events } = input.reduce((o, command) => {
      o.entityIds.push(command.entityId);
      o.events.push({ ...command, entityType, command: 'RESTORE' });
      return o;
    }, { entityIds: [], events: [] });

    await this.canPushRestore({ entityIds, entityType });
    return this.pushToStore({ events, session });
  }

  /**
   * @typedef ExecuteUpdateParams
   * @property {string} entityType
   * @property {ExecuteUpdateParamsInput[]} input
   * @property {ClientSession} [session]
   *
   * @typedef ExecuteUpdateParamsInput
   * @property {string} command
   * @property {Date|string} [date]
   * @property {*} entityId
   * @property {boolean} [omitFromHistory]
   * @property {boolean} [omitFromModified]
   * @property {ObjectId|null} [userId]
   * @property {object} [values]
   *
   * @param {ExecuteUpdateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async executeUpdate(params) {
    /** @type {ExecuteUpdateParams} */
    const { entityType, input, session } = await validateAsync(object({
      entityType: eventProps.entityType.required(),
      input: array().items(object({
        command: eventProps.command.required(),
        date: eventProps.date,
        entityId: eventProps.entityId.required(),
        omitFromHistory: eventProps.omitFromHistory,
        omitFromModified: eventProps.omitFromModified,
        userId: eventProps.userId,
        values: eventProps.values.default({}),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.executeUpdate'), params);

    const { entityIds, events } = input.reduce((o, command) => {
      o.entityIds.push(command.entityId);
      o.events.push({ ...command, entityType });
      return o;
    }, { entityIds: [], events: [] });

    await this.canPushUpdate({ entityIds, entityType });
    return this.pushToStore({ events, session });
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
    }).required().label('handler.getEntityStatesFor'), params);
    return this.store.getEntityStatesFor({ entityType, entityIds });
  }

  /**
   * Normalizes data from the event store based on the provided entity IDs
   *
   * @typedef NormalizeParams
   * @property {Array} entityIds
   * @property {string} entityType
   *
   * @param {NormalizeParams} params
   * @returns {Promise<void>}
   */
  async normalize(params) {
    /** @type {NormalizeParams} */
    const { entityIds, entityType } = await validateAsync(object({
      entityIds: array().items(eventProps.entityId).required(),
      entityType: eventProps.entityType.required(),
    }).required().label('handler.normalize'), params);

    return this.store.normalize({ entityIds, entityType });
  }

  /**
   * @typedef PushToStoreParams
   * @property {EventStoreDocument[]} events
   * @property {ClientSession} [session]
   *
   * @param {PushToStoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async pushToStore(params) {
    /** @type {PushToStoreParams} */
    const { events, session: currentSession } = await validateAsync(object({
      events: array().items(object({
        command: eventProps.command.required(),
        entityId: eventProps.entityId.required(),
        entityType: eventProps.entityType.required(),
        date: eventProps.date,
        omitFromHistory: eventProps.omitFromHistory,
        omitFromModified: eventProps.omitFromModified,
        values: eventProps.values,
        userId: eventProps.userId,
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.pushToStore'), params);

    const push = async (session) => {
      const results = await this.store.push({ events, session });
      await enqueueMessages({
        // strip values so they are not sent over the wire (can be large)
        messages: results.map(({ values, ...o }) => ({
          body: o,
          attributes: [
            { name: 'command', value: o.command },
            { name: 'entityId', value: EJSON.stringify(o.entityId) },
            { name: 'entityType', value: o.entityType },
            { name: 'userId', value: `${o.userId}` },
          ],
        })),
        queueUrl: this.sqs.url,
        sqsClient: this.sqs.client,
      });
      return results;
    };

    if (currentSession) {
      const results = await push(currentSession);
      return results;
    }

    const session = this.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        results = await push(activeSession);
      });
      return results;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Releases one or more entity field values.
   *
   * @param {ReservationsReleaseParams} params
   */
  async release(params) {
    /** @type {ReservationsReleaseParams} */
    const { input, session } = await validateAsync(object({
      input: array().items(object({
        entityId: eventProps.entityId.required(),
        entityType: eventProps.entityType.required(),
        key: reservationProps.key.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.release'), params);
    return this.reservations.release({ input, session });
  }

  /**
   * Reserves one or more entity field values.
   *
   * @param {ReservationsReserveParams} params
   */
  async reserve(params) {
    const { input, session } = await validateAsync(object({
      input: array().items(object({
        entityId: eventProps.entityId.required(),
        entityType: eventProps.entityType.required(),
        key: reservationProps.key.required(),
        value: reservationProps.value.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.reserve'), params);
    return this.reservations.reserve({ input, session });
  }

  /**
   *
   * @returns {ClientSession}
   */
  startSession() {
    return this.store.mongo.startSession();
  }
}
