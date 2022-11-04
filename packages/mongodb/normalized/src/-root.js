import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { DB_NAME, mongoDBClientProp } from '@parameter1/sso-mongodb-core';

const { array, object } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-core").MongoClient} MongoClient
 *
 * @typedef NormalizedRepoConstructorParams
 * @property {MongoClient} mongo
 */
export class NormalizedRepo {
  /**
   * @typedef RootNormalizedRepoConstructorParams
   * @property {string} entityType
   * @property {object[]} [indexes]
   * @property {MongoClient} mongo
   *
   * @param {RootNormalizedRepoConstructorParams} params
   */
  constructor(params) {
    /** @type {RootNormalizedRepoConstructorParams} */
    const { entityType, indexes, mongo } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      indexes: array().items(object()).default([]),
      mongo: mongoDBClientProp.required(),
    }).required());

    /** @type {string} */
    this.entityType = entityType;
    /** @type {object[]} */
    this.indexes = indexes;
    /** @type {MongoClient} */
    this.mongo = mongo;
    /** @type {import("@parameter1/sso-mongodb-core").Collection} */
    this.collection = mongo.db(DB_NAME).collection(`${entityType}/normalized`);
  }

  /**
   * Creates the database indexes for this normalized repo.
   *
   * @returns {Promise<string[]>}
   */
  async createIndexes() {
    const { indexes } = this;
    if (!indexes.length) return [];
    return this.collection.createIndexes(indexes);
  }
}
