import { PropTypes, attempt } from '@parameter1/prop-types';
import { DB_NAME, mongoDBClientProp } from '@parameter1/sso-mongodb-core';

const { object } = PropTypes;

export class EventStore {
  /**
   *
   * @param {object} params
   * @param {import("mongodb").MongoClient} params.mongo The MongoDB client
   */
  constructor(params) {
    const { mongo } = attempt(params, object({
      mongo: mongoDBClientProp.required(),
    }).required());
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
}
