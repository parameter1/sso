import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { DB_NAME, mongoDBClientProp } from '@parameter1/sso-mongodb-core';

const { object, string } = PropTypes;

export const userLogProps = {
  ip: string().allow(null).empty(null),
  ua: string().allow(null).empty(null),
};

export class UserLogRepo {
  /**
   * @typedef {import("@parameter1/sso-mongodb-core").MongoClient} MongoClient
   *
   * @typedef ConstructorParams
   * @property {MongoClient} mongo
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { mongo } = attempt(params, object({
      mongo: mongoDBClientProp.required(),
    }).required());

    /** @type {import("@parameter1/sso-mongodb-core").Collection} */
    this.collection = mongo.db(DB_NAME).collection('user-log');
  }

  async createIndexes() {
    return this.collection.createIndexes([
      { key: { userId: 1 } },
      { key: { date: 1, _id: 1 } },
    ]);
  }
}
