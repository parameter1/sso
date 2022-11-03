import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { EJSON, ObjectId } from '@parameter1/sso-mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { SQSClient, enqueueMessages } from '@parameter1/sso-sqs';

const {
  boolean,
  func,
  object,
  oneOrMany,
  url,
} = PropTypes;

/**
 * @typedef CommandHandlerConstructorParamsSQS
 * @property {SQSClient} client
 * @property {string} url
 *
 * @typedef CommandHandlerConstructorParams
 * @property {string} entityType
 * @property {string} queueUrl
 * @property {CommandHandlerConstructorParamsSQS} sqs
 *
 * @typedef {import("@parameter1/sso-mongodb-event-store").EventStoreDocument} EventStoreDocument
 * @typedef {import("@parameter1/sso-mongodb-event-store").EventStoreResult} EventStoreResult
 */
export class BaseCommandHandler {
  /**
   *
   * @param {CommandHandlerConstructorParams} params
   */
  constructor(params) {
    /** @type {CommandHandlerConstructorParams} */
    const { entityType, store, sqs } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      sqs: object({
        client: object().instance(SQSClient).required(),
        url: url().required(),
      }).required(),
      store: object().instance(EventStore).required(),
    }).required());

    /** @type {string} */
    this.entityType = entityType;
    /** @type {CommandHandlerConstructorParamsSQS} */
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
    }).required(), params);

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
   * @property {*} [entityId]
   * @property {Date|string} [date]
   * @property {object} [values]
   * @property {ObjectId|null} [userId]
   *
   * @typedef CommandHandlerExecuteCreateParams
   * @property {CommandHandlerExecuteCreateInput|CommandHandlerExecuteCreateInput[]} input
   *
   * @param {CommandHandlerExecuteCreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async executeCreate(params) {
    /** @type {CommandHandlerExecuteCreateParams} */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: this.entityIdPropType.default(() => this.generateId()),
        date: eventProps.date,
        values: eventProps.values.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('executeCreate'), params);

    return this.pushToStore({
      events: input.map((event) => ({
        ...event,
        command: 'CREATE',
      })),
    });
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
   *
   * @param {CommandHandlerPushToStoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async pushToStore(params) {
    /** @type {CommandHandlerPushToStoreParams} */
    const { events } = await validateAsync(object({
      events: oneOrMany(object({
        command: eventProps.command.required(),
        entityId: this.entityIdPropType.required(),
        date: eventProps.date,
        omitFromHistory: eventProps.omitFromHistory,
        omitFromModified: eventProps.omitFromModified,
        values: eventProps.values,
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('pushToStore'), params);

    const session = await this.store.mongo.startSession();

    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        results = await this.store.push(this.entityType, { events, session: activeSession });
        await enqueueMessages({
          bodies: results,
          queueUrl: this.sqs.url,
          sqsClient: this.sqs.client,
        });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }
}
