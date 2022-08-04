import { Repo, runTransaction } from '@parameter1/mongodb';
import { PropTypes, attempt, validateAsync } from '@parameter1/prop-types';
import { isFunction as isFn } from '@parameter1/utils';

import { EntityManager } from './entity-manager.js';
import { TokenRepo } from './token/repo.js';
import { mongoDBClientProp } from './props.js';
import { DB_NAME } from './constants.js';
import tokenProps from './token/props.js';
import userCommandProps from './command/props/user.js';

const {
  boolean,
  func,
  object,
  string,
} = PropTypes;

const userLogProps = {
  ip: string().allow(null).empty(null),
  ua: string().allow(null).empty(null),
};

export class UserManager {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {EntityManager} params.entityManager
   * @param {string} params.tokenSecret
   */
  constructor(params) {
    const { client, entityManager, tokenSecret } = attempt(params, object({
      client: mongoDBClientProp.required(),
      entityManager: object().instance(EntityManager).required(),
      tokenSecret: string().required(),
    }).required());

    this.client = client;
    this.entityManager = entityManager;
    this.token = new TokenRepo({ client, tokenSecret });
    this.userLog = new Repo({
      client,
      collectionName: 'user-log',
      dbName: DB_NAME,
      name: 'user log',
      indexes: [
        { key: { userId: 1 } },
        { key: { date: 1, _id: 1 } },
      ],
    });
  }

  createIndexes() {
    return Promise.all([
      this.token.createIndexes(),
      this.userLog.createIndexes(),
    ]);
  }

  /**
   * Creates a magic login link token for the provided user ID.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   * @param {string} [params.ttl=3600]
   * @param {string} [params.scope]
   * @param {boolean} [params.impersonated=false]
   * @param {function} [params.inTransaction]
   */
  async createLoginLinkToken(params = {}) {
    const {
      email,
      ip,
      ua,
      ttl,
      scope,
      impersonated,
      session: currentSession,
      inTransaction,
    } = await validateAsync(object({
      email: userCommandProps.email.required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
      ttl: tokenProps.ttl.default(3600),
      scope: string(),
      impersonated: boolean().default(false),
      session: object(),
      inTransaction: func(),
    }).required(), params);

    return runTransaction(async ({ session }) => {
      const user = await this.entityManager.getMaterializedRepo('user').findByEmail({
        email,
        options: { strict: true, projection: { email: 1 } },
      });
      const data = { ...(scope && { scope }), ...(impersonated && { impersonated }) };

      const token = await this.token.createAndSign({
        subject: 'login-link',
        audience: user._id,
        ttl: impersonated ? 60 : ttl,
        data,
      }, { session });

      await this.logAction({
        userId: user._id,
        action: 'send-login-link',
        ip,
        ua,
        data: { scope, loginToken: token, impersonated },
      }, { session });

      if (isFn(inTransaction)) await inTransaction({ user, token });
      return token.signed;
    }, { currentSession, client: this.client });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.userId
   * @param {string} params.action
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   * @param {object} [params.data={}]
   *
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async logAction(params, { session } = {}) {
    const doc = await validateAsync(object({
      userId: userCommandProps.id.required(),
      action: string().required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
      data: object().default({}),
    }).required().custom((event) => ({
      ...event,
      date: '$$NOW',
    })), params);
    return this.userLog.updateOne({
      query: { _id: { $lt: 0 } },
      update: [{
        $replaceRoot: { newRoot: { $mergeObjects: [doc, '$$ROOT'] } },
      }],
      options: { upsert: true, session },
    });
  }
}
