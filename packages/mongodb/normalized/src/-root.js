import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { mongoClientProp } from '@parameter1/mongodb-prop-types';

const { array, object } = PropTypes;

/**
 * @typedef {import("@parameter1/mongodb-core").MongoClient} MongoClient
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
      mongo: mongoClientProp.required(),
    }).required());

    /** @type {string} */
    this.entityType = entityType;
    /** @type {object[]} */
    this.indexes = indexes;
    /** @type {MongoClient} */
    this.mongo = mongo;
    /** @type {import("mongodb").Collection} */
    this.collection = mongo.db('sso').collection(`${entityType}/normalized`);
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
