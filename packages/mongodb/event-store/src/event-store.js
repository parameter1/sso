import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { DB_NAME, mongoDBClientProp } from '@parameter1/sso-mongodb-core';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef EventStoreDocument
 * @property {string} command The command name
 * @property {Date|string} [date=$$NOW] The date of the event
 * @property {*} entityId The entity/document ID to assign to the values to
 * @property {string} entityType The entity type to assign to the values to
 * @property {boolean} [omitFromHistory=false] Whether to omit the entry from the normalized history
 * @property {boolean} [omitFromModified=false] Whether to omit the date and user from modified
 * @property {object} [values={}] The values to push
 * @property {import("mongodb").ObjectId} [userId] The user that pushed the command
 *
 * @typedef EventStoreResult
 * @property {ObjectId} _id
 * @property {string} command
 * @property {*} entityId
 * @property {string} entityType
 * @property {ObjectId} [userId]
 *
 * @typedef EventStoreConstructorParams
 * @property {import("mongodb").MongoClient} params.mongo The MongoDB client
 */
export class EventStore {
  /**
   *
   * @param {object} params
   * @param {import("mongodb").MongoClient} params.mongo The MongoDB client
   */
  constructor(params) {
    /** @type {EventStoreConstructorParams} */
    const { mongo } = attempt(params, object({
      mongo: mongoDBClientProp.required(),
    }).required());

    /** @type {import("mongodb").Collection} */
    this.collection = mongo.db(DB_NAME).collection('event-store');
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
   * Pushes and persists one or more events to the store.
   *
   * @param {object} params
   * @param {EventStoreDocument|EventStoreDocument[]} params.events
   * @param {import("mongodb").ClientSession} [params.session]
   * @returns {Promise<EventStoreResult[]>}
   */
  async push(params) {
    const { events, session } = await validateAsync(object({
      events: oneOrMany(object({
        command: eventProps.command.required(),
        entityId: eventProps.entityId.required(),
        entityType: eventProps.entityType.required(),
        date: eventProps.date.default('$$NOW'),
        omitFromHistory: eventProps.omitFromHistory.default(false),
        omitFromModified: eventProps.omitFromModified.default(false),
        values: eventProps.values.default({}),
        userId: eventProps.userId.default(null),
      })),
      session: object(),
    }).required(), params);

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
