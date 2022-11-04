import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { EJSON, ObjectId, mongoSessionProp } from '@parameter1/sso-mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { SQSClient, enqueueMessages } from '@parameter1/sso-sqs';
import { Reservations } from '../reservations.js';
import reservationProps from '../props/reservation.js';

const {
  boolean,
  func,
  object,
  oneOrMany,
  url,
} = PropTypes;

/**
 * @typedef {import("mongodb").ClientSession} ClientSession
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 * @typedef {import("../types").ReservationsReleaseParams} ReservationsReleaseParams
 * @typedef {import("../types").ReservationsReserveParams} ReservationsReserveParams
 *
 * @typedef BaseCommandHandlerConstructorParamsSQS
 * @property {SQSClient} client
 * @property {string} url
 *
 * @typedef BaseCommandHandlerConstructorParams
 * @property {string} entityType
 * @property {Reservations} reservations
 * @property {EventStore} store
 * @property {BaseCommandHandlerConstructorParamsSQS} sqs
 *
 * @typedef CommandHandlerConstructorParams
 * @property {Reservations} reservations
 * @property {EventStore} store
 * @property {BaseCommandHandlerConstructorParamsSQS} sqs
 *
 * @typedef {import("@parameter1/sso-mongodb-event-store").EventStoreDocument} EventStoreDocument
 */
export class BaseCommandHandler {
  /**
   *
   * @param {BaseCommandHandlerConstructorParams} params
   */
  constructor(params) {
    /** @type {BaseCommandHandlerConstructorParams} */
    const {
      entityType,
      reservations,
      store,
      sqs,
    } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      reservations: object().instance(Reservations).required(),
      sqs: object({
        client: object().instance(SQSClient).required(),
        url: url().required(),
      }).required(),
      store: object().instance(EventStore).required(),
    }).required());

    /** @type {string} */
    this.entityType = entityType;
    /** @type {Reservations} */
    this.reservations = reservations;
    /** @type {BaseCommandHandlerConstructorParamsSQS} */
    this.sqs = sqs;
    /** @type {EventStore} */
    this.store = store;

    this.entityIdPropType = getEntityIdPropType(this.entityType);
    this.generateId = () => new ObjectId();
  }

  /**
   * @typedef CommandHandlerCanPushParams
   * @property {*|*[]} entityIds
   * @property {function} eligibleWhenFn
   * @property {boolean} [throwWhenFalse=true]
   *
   * @param {CommandHandlerCanPushParams} params
   */
  async canPush(params) {
    /** @type {CommandHandlerCanPushParams} */
    const { entityIds, eligibleWhenFn, throwWhenFalse } = await validateAsync(object({
      entityIds: oneOrMany(this.entityIdPropType.required()).required(),
      eligibleWhenFn: func().required(),
      throwWhenFalse: boolean().default(true),
    }).required().label('handler.canPush'), params);

    const states = await this.getEntityStatesFor(entityIds);
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
   * @returns {Promise<boolean>}
   */
  async canPushDelete(entityIds, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => state === 'CREATED',
    });
  }

  /**
   *
   * @param {*|*[]} entityIds
   * @param {object} options
   * @param {boolean} options.throwWhenFalse
   * @returns {Promise<boolean>}
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
   * @returns {Promise<boolean>}
   */
  async canPushUpdate(entityIds, { throwWhenFalse } = {}) {
    return this.canPush({
      entityIds,
      throwWhenFalse,
      eligibleWhenFn: ({ state }) => state === 'CREATED',
    });
  }

  /**
   * @typedef CommandHandlerExecuteCreateInput
   * @property {Date|string} [date]
   * @property {*} entityId
   * @property {ObjectId|null} [userId]
   * @property {object} [values]
   *
   * @typedef CommandHandlerExecuteCreateParams
   * @property {CommandHandlerExecuteCreateInput|CommandHandlerExecuteCreateInput[]} input
   * @property {ClientSession} [session]
   *
   * @param {CommandHandlerExecuteCreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async executeCreate(params) {
    /** @type {CommandHandlerExecuteCreateParams} */
    const { input, session } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: this.entityIdPropType.required(),
        userId: eventProps.userId,
        values: eventProps.values.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.executeCreate'), params);

    return this.pushToStore({
      events: input.map((event) => ({
        ...event,
        command: 'CREATE',
      })),
      session,
    });
  }

  /**
   * @typedef CommandHandlerExecuteUpdateParams
   * @property {CommandHandlerExecuteUpdateInput|CommandHandlerExecuteUpdateInput[]} input
   * @property {ClientSession} [session]
   *
   * @typedef CommandHandlerExecuteUpdateInput
   * @property {string} command
   * @property {Date|string} [date]
   * @property {*} entityId
   * @property {boolean} [omitFromHistory]
   * @property {boolean} [omitFromModified]
   * @property {ObjectId|null} [userId]
   * @property {object} [values]
   *
   * @param {CommandHandlerExecuteUpdateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async executeUpdate(params) {
    /** @type {CommandHandlerExecuteUpdateParams} */
    const { input, session } = await validateAsync(object({
      input: oneOrMany(object({
        command: eventProps.command.required(),
        date: eventProps.date,
        entityId: this.entityIdPropType.required(),
        omitFromHistory: eventProps.omitFromHistory,
        omitFromModified: eventProps.omitFromModified,
        userId: eventProps.userId,
        values: eventProps.values.default({}),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.executeUpdate'), params);

    const { entityIds, events } = input.reduce((o, command) => {
      o.entityIds.push(command.entityId);
      o.events.push(command);
      return o;
    }, { entityIds: [], events: [] });

    await this.canPushUpdate(entityIds);
    return this.pushToStore({ events, session });
  }

  /**
   * Gets the entity state for the provided entity IDs.
   *
   * @param {*[]} entityIds
   * @returns {Promise<Map<string, string>>}
   */
  async getEntityStatesFor(entityIds) {
    const ids = attempt(entityIds, oneOrMany(this.entityIdPropType.required()).required());
    return this.store.getEntityStatesFor(this.entityType, { entityIds: ids });
  }

  /**
   * @typedef CommandHandlerPushToStoreParams
   * @property {EventStoreDocument|EventStoreDocument[]} events
   * @property {ClientSession} [session]
   *
   * @param {CommandHandlerPushToStoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async pushToStore(params) {
    /** @type {CommandHandlerPushToStoreParams} */
    const { events, session: currentSession } = await validateAsync(object({
      events: oneOrMany(object({
        command: eventProps.command.required(),
        entityId: this.entityIdPropType.required(),
        date: eventProps.date,
        omitFromHistory: eventProps.omitFromHistory,
        omitFromModified: eventProps.omitFromModified,
        values: eventProps.values,
        userId: eventProps.userId,
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.pushToStore'), params);

    const push = async (session) => {
      const results = await this.store.push(this.entityType, { events, session });
      await enqueueMessages({
        // strip values so they are not sent over the wire (can be large)
        bodies: results.map(({ values, ...rest }) => rest),
        queueUrl: this.sqs.url,
        sqsClient: this.sqs.client,
      });
      return results;
    };

    if (currentSession) {
      const results = await push(currentSession);
      return results;
    }

    const session = await this.store.mongo.startSession();
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
    const { input, session } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: this.entityIdPropType.required(),
        key: reservationProps.key.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.release'), params);
    return this.reservations.release(this.entityType, { input, session });
  }

  /**
   * Reserves one or more entity field values.
   *
   * @param {ReservationsReserveParams} params
   */
  async reserve(params) {
    const { input, session } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: this.entityIdPropType.required(),
        key: reservationProps.key.required(),
        value: reservationProps.value.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required().label('handler.reserve'), params);
    return this.reservations.reserve(this.entityType, { input, session });
  }
}
