import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { EJSON } from '@parameter1/mongodb-bson';
import { mongoClientProp, mongoSessionProp } from '@parameter1/mongodb-prop-types';
import { SQSClient, enqueueMessages } from '@parameter1/sso-sqs';

const {
  any,
  array,
  boolean,
  func,
  object,
  string,
  url,
} = PropTypes;

export const reservationProps = {
  key: string(),
  value: any().disallow(null, ''),
};

/**
 * @typedef {import("./index").EventStoreResult} EventStoreResult
 * @typedef {import("./index").EventStoreDocument} EventStoreDocument
 * @typedef {import("mongodb").BulkWriteResult} BulkWriteResult
 * @typedef {import("@parameter1/mongodb-core").Collection} Collection
 * @typedef {import("@parameter1/mongodb-core").ClientSession} ClientSession
 * @typedef {import("@parameter1/mongodb-core").MongoClient} MongoClient
 *
 * @typedef ReservationsReleaseParams
 * @property {ReservationsReleaseParamsInput[]} input
 * @property {ClientSession} [session]
 *
 * @typedef ReservationsReleaseParamsInput
 * @property {*} entityId
 * @property {string} entityType
 * @property {string} key
 *
 * @typedef ReservationsReserveParams
 * @property {ReservationsReserveParamsInput[]} input
 * @property {ClientSession} [session]
 *
 * @typedef ReservationsReserveParamsInput
 * @property {*} entityId
 * @property {string} entityType
 * @property {string} key
 * @property {boolean} [upsert=false]
 * @property {*} value
 *
 * @typedef EventStoreConstructorParams
 * @property {MongoClient} mongo The MongoDB client
 * @property {EventStoreConstructorParamsSQS} sqs
 *
 * @typedef EventStoreConstructorParamsSQS
 * @property {SQSClient} client
 * @property {string} url
 */
export class EventStore {
  /**
   *
   * @param {EventStoreConstructorParams} params
   */
  constructor(params) {
    /** @type {EventStoreConstructorParams} */
    const { mongo, sqs } = attempt(params, object({
      mongo: mongoClientProp.required(),
      sqs: object({
        client: object().instance(SQSClient).required(),
        url: url().required(),
      }).required(),
    }).required());

    /** @type {MongoClient} */
    this.mongo = mongo;

    /** @type {Collection} */
    this.collection = mongo.db('sso').collection('event-store');

    /** @type {Collection} */
    this.reservations = mongo.db('sso').collection('reservations');

    /** @type {CommandHandlerConstructorParamsSQS} */
    this.sqs = sqs;
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
      entityIds: array().items(eventProps.entityId.required()).required(),
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

  /**
   * Creates the database indexes for the store and reservation collection.
   *
   * @returns {Promise<Map<string, string[]>>}
   */
  async createIndexes() {
    return new Map(await Promise.all([
      (async () => {
        const r = await this.collection.createIndexes([
          { key: { entityId: 1, date: 1, _id: 1 } },
          { key: { entityId: 1, entityType: 1, command: 1 } },
          { key: { entityId: 1, entityType: 1 }, unique: true, partialFilterExpression: { command: 'CREATE' } },
          // for upserts
          {
            name: '_upsert.organization.key',
            key: { 'values.key': 1 },
            unique: true,
            partialFilterExpression: { command: 'CREATE', entityType: 'organization' },
          },
          {
            name: '_upsert.workspace.app_org_key',
            key: { 'values.appId': 1, 'values.orgId': 1, 'values.key': 1 },
            unique: true,
            partialFilterExpression: { command: 'CREATE', entityType: 'workspace' },
          },
        ]);
        return ['store', r];
      })(),
      (async () => {
        const r = await this.reservations.createIndexes([
          { key: { entityId: 1, entityType: 1, key: 1 }, unique: true },
          { key: { value: 1, key: 1, entityType: 1 }, unique: true },
        ]);
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

    return this.push({
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
    return this.push({ events, session });
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
    return this.push({ events, session });
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
    return this.push({ events, session });
  }

  /**
   * Gets the entity state for the provided entity IDs.
   *
   * @typedef GetEntityStatesForParams
   * @property {Array} entityIds
   * @property {string} entityType
   * @property {ClientSession} [session]
   *
   * @param {GetEntityStatesForParams} params
   * @returns {Promise<Map<string, string>>}
   */
  async getEntityStatesFor(params) {
    /** @type {GetEntityStatesForParams} */
    const { entityIds, entityType, session } = await validateAsync(object({
      entityIds: array().items(eventProps.entityId.required()).required(),
      entityType: eventProps.entityType.required(),
      session: object(),
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

    const docs = await this.collection.aggregate(pipeline, { session }).toArray();
    return docs.reduce((map, doc) => {
      map.set(EJSON.stringify(doc._id), doc.state);
      return map;
    }, new Map());
  }

  /**
   * Pushes and persists one or more events to the store.
   *
   * @typedef PushParams
   * @prop {boolean} [enqueue=true]
   * @prop {EventStoreDocument[]} events
   * @prop {import("mongodb").ClientSession} [session]
   *
   * @param {PushParams} params The push parameters
   * @returns {Promise<EventStoreResult[]>}
   */
  async push(params) {
    /** @type {PushParams} */
    const { enqueue, events, session: currentSession } = await validateAsync(object({
      enqueue: boolean().default(true),
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

    const push = async (session) => {
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
      const results = result.upserted.map(({ _id, index }) => {
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
      if (!enqueue) return results;

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

    const session = this.mongo.startSession();
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
   * Releases entity field values.
   *
   * @param {ReservationsReleaseParams} params
   * @returns {Promise<BulkWriteResult>}
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
    }).required(), params);

    const operations = input.map((document) => ({
      deleteOne: { filter: document },
    }));
    return this.reservations.bulkWrite(operations, { session });
  }

  /**
   * Reserves entity field values.
   *
   * @param {ReservationsReserveParams} params
   * @returns {Promise<BulkWriteResult>}
   */
  async reserve(params) {
    /** @type {ReservationsReserveParams} */
    const { input, session } = await validateAsync(object({
      input: array().items(object({
        entityId: eventProps.entityId.required(),
        entityType: eventProps.entityType.required(),
        key: reservationProps.key.required(),
        upsert: boolean().default(false),
        value: reservationProps.value.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required(), params);

    const operations = input.map(({
      upsert,
      key,
      value,
      entityType,
      ...rest
    }) => {
      if (upsert) {
        const filter = { value, key, entityType };
        return {
          updateOne: {
            filter,
            update: { $setOnInsert: { ...rest, ...filter } },
            upsert: true,
          },
        };
      }
      return {
        insertOne: {
          document: {
            ...rest,
            value,
            key,
            entityType,
          },
        },
      };
    });

    try {
      const result = await this.reservations.bulkWrite(operations, { session });
      return result;
    } catch (e) {
      if (e.code !== 11000 || !e.writeErrors) throw e;
      const [writeError] = e.writeErrors;
      const { op } = writeError.err;
      const error = new Error(`The ${op.entityType} ${op.key} '${op.value}' is already in use.'`);
      error.statusCode = 409;
      throw error;
    }
  }

  /**
   *
   * @returns {ClientSession}
   */
  startSession() {
    return this.mongo.startSession();
  }

  async upsert(params) {
    const { entityType, events, session: currentSession } = await validateAsync(object({
      entityType: eventProps.entityType.required(),
      events: array().items(object({
        date: eventProps.date.default('$$NOW'),
        entityId: eventProps.entityId.required(),
        omitFromHistory: eventProps.omitFromHistory.default(false),
        omitFromModified: eventProps.omitFromModified.default(false),
        values: eventProps.values.default({}),
        upsertOn: array().items(string().required()).required(),
        userId: eventProps.userId.default(null),
      })).required(),
      session: object(),
    }).required().label('eventStore.upsert'), params);

    const push = async (session) => {
      const operations = [];
      const queries = [];
      events.forEach(({ upsertOn, values, ...event }) => {
        const query = upsertOn.reduce((o, key) => ({ ...o, [`values.${key}`]: values[key] }), {});
        const setOnInsert = {
          ...event,
          entityType,
        };
        const set = { values: { $literal: values } };
        queries.push(query);
        operations.push({
          updateOne: {
            filter: { entityType, command: 'CREATE', ...query },
            update: [{ $replaceRoot: { newRoot: { $mergeObjects: [setOnInsert, '$$ROOT', set] } } }],
            upsert: true,
          },
        });
      });
      await this.collection.bulkWrite(operations, { session });
      return this.collection.find({
        entityType,
        command: 'CREATE',
        $or: queries,
      }, {
        projection: {
          _id: 1,
          command: 1,
          entityId: 1,
          entityType: 1,
          userId: 1,
          values: 1,
        },
        session,
      }).map((doc) => ({ ...doc, values: doc.values || {} })).toArray();
    };

    if (currentSession) {
      const results = await push(currentSession);
      return results;
    }

    const session = this.mongo.startSession();
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
   * Gets the event store sort order.
   *
   * @returns {object}
   */
  static getEventSort() {
    return { entityId: 1, date: 1, _id: 1 };
  }
}
