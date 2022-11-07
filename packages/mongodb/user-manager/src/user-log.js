import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { mongoClientProp } from '@parameter1/mongodb-prop-types';

const { object, string } = PropTypes;

export const userLogProps = {
  ip: string().allow(null).empty(null),
  ua: string().allow(null).empty(null),
};

export class UserLogRepo {
  /**
   * @typedef {import("@parameter1/sso-mongodb").MongoClient} MongoClient
   *
   * @typedef ConstructorParams
   * @property {MongoClient} mongo
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { mongo } = attempt(params, object({
      mongo: mongoClientProp.required(),
    }).required());

    /** @type {import("@parameter1/sso-mongodb").Collection} */
    this.collection = mongo.db('sso').collection('user-log');
  }

  async createIndexes() {
    return this.collection.createIndexes([
      { key: { userId: 1 } },
      { key: { date: 1, _id: 1 } },
    ]);
  }
}
