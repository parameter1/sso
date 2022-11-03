import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { DB_NAME, mongoDBClientProp, mongoSessionProp } from '@parameter1/sso-mongodb-core';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import reservationProps from './props/reservation.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-core").BulkWriteResult} BulkWriteResult
 * @typedef {import("@parameter1/sso-mongodb-core").Collection} Collection
 * @typedef {import("@parameter1/sso-mongodb-core").MongoClient} MongoClient
 *
 * @typedef {import("./index").ReservationsReleaseParams} ReservationsReleaseParams
 * @typedef {import("./index").ReservationsReserveParams} ReservationsReserveParams
 */
export class Reservations {
  /**
   * @typedef ReservationsConstructorParams
   * @property {MongoClient} mongo The MongoDB client
   *
   * @param {ReservationsConstructorParams} params
   */
  constructor(params) {
    /** @type {ReservationsConstructorParams} */
    const { mongo } = attempt(params, object({
      mongo: mongoDBClientProp,
    }).required());

    /** @type {MongoClient} */
    this.mongo = mongo;

    /** @type {Collection} */
    this.collection = mongo.db(DB_NAME).collection('reservations');
  }

  /**
   * Creates the database indexes for the reservations collection.
   *
   * @returns {Promise<string[]>}
   */
  async createIndexes() {
    return this.collection.createIndexes([
      { key: { entityId: 1 } },
      { key: { value: 1, key: 1, entityType: 1 }, unique: true },
    ]);
  }

  /**
   * Releases one or more entity field values.
   *
   * @param {string} type The entity type
   * @param {ReservationsReleaseParams} params
   * @returns {Promise<BulkWriteResult>}
   */
  async release(type, params) {
    /** @type {string} */
    const entityType = attempt(type, eventProps.entityType.required());

    /** @type {ReservationsReleaseParams} */
    const { input, session } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: getEntityIdPropType(entityType).required(),
        key: reservationProps.key.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required(), params);

    const operations = input.map((document) => ({
      deleteOne: { filter: { ...document, entityType } },
    }));

    return this.collection.bulkWrite(operations, { session });
  }

  /**
   * Reserves one or more entity field values.
   *
   * @param {string} type The entity type
   * @param {ReservationsReserveParams} params
   * @returns {Promise<BulkWriteResult>}
   */
  async reserve(type, params) {
    /** @type {string} */
    const entityType = attempt(type, eventProps.entityType.required());

    /** @type {ReservationsReserveParams} */
    const { input, session } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: getEntityIdPropType(entityType).required(),
        key: reservationProps.key.required(),
        value: reservationProps.value.required(),
      }).required()).required(),
      session: mongoSessionProp,
    }).required(), params);

    const operations = input.map((document) => ({
      insertOne: { ...document, entityType },
    }));

    try {
      const result = await this.collection.bulkWrite(operations, { session });
      return result;
    } catch (e) {
      if (e.code !== 11000 || !e.writeErrors) throw e;
      const [writeError] = e.writeErrors;
      const { op } = writeError.err;
      throw new Error(`The ${op.entityType} ${op.key} '${op.value}' is already in use.'`);
    }
  }
}
