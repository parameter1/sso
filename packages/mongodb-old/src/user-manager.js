import { Repo, runTransaction } from '@parameter1/mongodb';
import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types';
import { isFunction as isFn } from '@parameter1/utils';
import { get } from '@parameter1/object-path';

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

  /**
   * Creates token and user log database indexes.
   */
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
  async createLoginLinkToken(params) {
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
      const user = await this.findUserByEmail(email, { projection: { email: 1 } });
      const data = { ...(scope && { scope }), ...(impersonated && { impersonated }) };

      const token = await this.token.createAndSign({
        subject: 'magic-login-link',
        audience: user._id,
        ttl: impersonated ? 60 : ttl,
        data,
      }, { session });

      await this.logAction({
        userId: user._id,
        action: 'send-magic-login-link',
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
   * @param {ObjectId} userId
   * @param {object} options
   * @param {object} [options.projection]
   * @param {ClientSession} [options.session]
   * @param {boolean} [options.strict=true]
   */
  async findUserById(userId, { projection, session, strict = true } = {}) {
    const _id = attempt(userId, userCommandProps.id.required());
    return this.entityManager.getMaterializedRepo('user').findOne({
      query: { _id, _deleted: false },
      options: { projection, session, strict },
    });
  }

  /**
   *
   * @param {string} email
   * @param {object} options
   * @param {object} [options.projection]
   * @param {ClientSession} [options.session]
   * @param {boolean} [options.strict=true]
   */
  async findUserByEmail(email, { projection, session, strict = true } = {}) {
    const value = attempt(email, userCommandProps.email.required());
    return this.entityManager.getMaterializedRepo('user').findOne({
      query: { email: value, _deleted: false },
      options: { projection, session, strict },
    });
  }

  /**
   * @param {object} params
   * @param {string|ObjectId} params.userId
   * @param {boolean} [params.impersonated=false]
   * @param {ClientSession} [params.session]
   */
  async getOrCreateAuthToken(params) {
    const {
      userId,
      impersonated,
      session,
    } = await validateAsync(object({
      userId: userCommandProps.id.required(),
      impersonated: boolean().default(false),
      session: object(),
    }).required(), params);
    const query = {
      subject: 'magic-auth',
      audience: userId,
      'data.impersonated': impersonated ? true : { $ne: true },
      expiresAt: { $gt: new Date() },
    };
    const doc = await this.token.findOne({ query, options: { session } });
    if (doc) return { doc, signed: this.token.signDocument(doc) };
    return this.token.createAndSign({
      subject: 'magic-auth',
      audience: userId,
      data: { ...(impersonated && { impersonated: true }) },
      ttl: impersonated ? 60 * 60 : 60 * 60 * 24,
    }, { session });
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

  /**
   * @param {object} params
   * @param {string} params.authToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  async logoutMagicUser(params) {
    const { authToken: token, ip, ua } = await validateAsync(object({
      authToken: string().required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
    }).required(), params);

    const authToken = await this.token.verify({ token, subject: 'magic-auth' });
    const userId = get(authToken, 'doc.audience');
    const impersonated = get(authToken, 'doc.data.impersonated');
    const user = await this.findUserById(userId);

    return runTransaction(async ({ session }) => {
      await this.token.invalidate({ id: get(authToken, 'doc._id'), options: { session } });
      await this.logAction({
        userId: user._id,
        action: 'logout-magic-user',
        ip,
        ua,
        data: { authToken, impersonated },
      }, { session });
      return 'ok';
    }, { client: this.client });
  }

  /**
   * Magically logs a user in using the provided login token.
   *
   * @param {object} params
   * @param {string} params.loginToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  async magicLogin(params) {
    const {
      loginLinkToken: token,
      ip,
      ua,
    } = await validateAsync(object({
      loginLinkToken: string().required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
    }).required(), params);

    const loginLinkToken = await this.token.verify({ token, subject: 'magic-login-link' });
    const impersonated = get(loginLinkToken, 'doc.data.impersonated');
    const user = await this.findUserById(get(loginLinkToken, 'doc.audience'), { projection: { email: 1 } });

    return runTransaction(async ({ session }) => {
      const authToken = await this.getOrCreateAuthToken({
        userId: user._id,
        impersonated,
        session,
      });

      await this.logAction({
        userId: user._id,
        action: 'magic-login',
        ip,
        ua,
        data: { loginLinkToken, authToken, impersonated },
      }, { session });

      if (!impersonated) {
        await this.entityManager.getCommandHandler('user').magicLogin({
          entityId: user._id,
        }, { session });
      }
      await this.token.invalidate({ id: get(loginLinkToken, 'doc._id'), options: { session } });

      return {
        authToken: authToken.signed,
        userId: user._id,
        authDoc: authToken.doc,
      };
    }, { client: this.client });
  }

  /**
   * @param {object} params
   * @param {string} params.authToken
   * @param {object} [params.projection={ _id: 1 }]
   */
  async verifyMagicAuthToken(params) {
    const { authToken, projection } = await validateAsync(object({
      authToken: string().required(),
      projection: object().default({ _id: 1 }),
    }).required(), params);

    try {
      const { doc } = await this.token.verify({ token: authToken, subject: 'magic-auth' });
      const { audience: userId } = doc;
      const user = await this.findUserById(userId, { projection });
      return user;
    } catch (e) {
      throw Repo.createError(401, `Authentication failed: ${e.message}`);
    }
  }
}
