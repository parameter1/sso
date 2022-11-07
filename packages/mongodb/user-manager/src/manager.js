import { UserCommands, userProps } from '@parameter1/sso-mongodb-command';
import { mongoDBClientProp, mongoSessionProp } from '@parameter1/sso-mongodb-core';
import { MaterializedUserRepo } from '@parameter1/sso-mongodb-materialized';
import { TokenRepo, tokenProps } from '@parameter1/sso-mongodb-token';
import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { isFunction as isFn } from '@parameter1/utils';
import { get } from '@parameter1/object-path';

import { UserLogRepo, userLogProps } from './user-log.js';

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const {
  boolean,
  func,
  object,
  string,
} = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-core").ClientSession} ClientSession
 * @typedef {import("@parameter1/sso-mongodb-core").ObjectId} ObjectId
 * @typedef {import("mongodb").FindOptions} FindOptions
 * @typedef {import("@parameter1/sso-mongodb-token")
 *  .CreateAndSignTokenResult} CreateAndSignTokenResult
 *
 * @typedef FindUserOptions
 * @property
 */
export class UserManager {
  /**
   * @typedef {import("@parameter1/sso-mongodb-core").MongoClient} MongoClient
   *
   * @typedef ConstructorParams
   * @property {MongoClient} mongo
   * @property {UserCommands} commands
   * @property {TokenRepo} token
   * @property {MaterializedUserRepo} materialized
   * @property {UserLogRepo} userLog
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const {
      mongo,
      commands,
      token,
      materialized,
      userLog,
    } = attempt(params, object({
      mongo: mongoDBClientProp.required(),
      commands: object().instance(UserCommands).required(),
      token: object().instance(TokenRepo).required(),
      materialized: object().instance(MaterializedUserRepo).required(),
      userLog: object().instance(UserLogRepo).required(),
    }).required());

    /** @type {MongoClient} */
    this.mongo = mongo;
    /** @type {UserCommands} */
    this.commands = commands;
    /** @type {TokenRepo} */
    this.token = token;
    /** @type {MaterializedUserRepo} */
    this.materialized = materialized;
    /** @type {UserLogRepo} */
    this.userLog = userLog;
  }

  /**
   * @typedef CreateLoginLinkTokenParams
   * @property {string} email
   * @property {string} [ip]
   * @property {string} [ua]
   * @property {string} [ttl=3600]
   * @property {string} [scope]
   * @property {boolean} [impersonated=false]
   * @property {ClientSession} [session]
   * @property {Function} [inTransaction]
   *
   * @param {CreateLoginLinkTokenParams} params
   */
  async createLoginLinkToken(params) {
    /** @type {CreateLoginLinkTokenParams} */
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
      email: userProps.email.required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
      ttl: tokenProps.ttl.default(3600),
      scope: string(),
      impersonated: boolean().default(false),
      session: mongoSessionProp,
      inTransaction: func(),
    }).required(), params);

    const create = async (session) => {
      const user = await this.findUserByEmail({
        email,
        options: { projection: { email: 1 } },
      });
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
    };

    if (currentSession) {
      const results = await create(currentSession);
      return results;
    }

    const session = this.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        results = await create(activeSession);
      });
      return results;
    } finally {
      await session.endSession();
    }
  }

  /**
   * @typedef FindUserByEmailParams
   * @property {string} email
   * @property {boolean} [strict=true]
   * @property {FindOptions} [options]
   *
   * @param {FindUserByEmailParams} params
   */
  async findUserByEmail(params) {
    /** @type {FindUserByEmailParams} */
    const { email, strict, options } = await validateAsync(object({
      email: userProps.email.required(),
      strict: boolean().default(false),
      options: object(),
    }).required(), params);
    const user = await this.materialized.collection.findOne({
      email,
      _deleted: false,
    }, options);
    if (strict && !user) throw createError(404, `No user was found for ID ${email}`);
    return user;
  }

  /**
   * @typedef FindUserByIdParams
   * @property {ObjectId} _id
   * @property {boolean} [strict=true]
   * @property {FindOptions} [options]
   *
   * @param {FindUserByIdParams} params
   */
  async findUserById(params) {
    /** @type {FindUserByIdParams} */
    const { _id, strict, options } = await validateAsync(object({
      _id: userProps.id.required(),
      strict: boolean().default(false),
      options: object(),
    }).required(), params);
    const user = await this.materialized.collection.findOne({
      _id,
      _deleted: false,
    }, options);
    if (strict && !user) throw createError(404, `No user was found for ID ${_id}`);
    return user;
  }

  /**
   * @typedef GetOrCreateAuthTokenParams
   * @prop {ObjectId} userId
   * @prop {boolean} [impersonated=false]
   * @prop {ClientSession} [session]
   *
   * @param {GetOrCreateAuthTokenParams} params
   * @returns {Promise<CreateAndSignTokenResult>}
   */
  async getOrCreateAuthToken(params) {
    /** @type {GetOrCreateAuthTokenParams} */
    const { userId, impersonated, session } = await validateAsync(object({
      userId: userProps.id.required(),
      impersonated: boolean().default(false),
      session: mongoSessionProp,
    }).required(), params);

    const doc = await this.token.collection.findOne({
      subject: 'magic-auth',
      audience: userId,
      'data.impersonated': impersonated ? true : { $ne: true },
      expiresAt: { $gt: new Date() },
    }, { session });
    if (doc) return { doc, signed: this.token.signDocument(doc) };
    return this.token.createAndSign({
      subject: 'magic-auth',
      audience: userId,
      data: { ...(impersonated && { impersonated: true }) },
      ttl: impersonated ? 60 * 60 : 60 * 60 * 24,
    }, { session });
  }

  /**
   * @typedef LogActionParams
   * @property {ObjectId} userId
   * @property {string} action
   * @property {string} [ip]
   * @property {string} [ua]
   * @property {object} [data={}]
   *
   * @typedef LogActionOptions
   * @property {ClientSession} [session]
   *
   * @param {LogActionParams} params
   * @param {LogActionOptions} options
   * @returns {Promise<import("mongodb").UpdateResult>}
   */
  async logAction(params, { session } = {}) {
    /** @type {LogActionParams} */
    const doc = await validateAsync(object({
      userId: userProps.id.required(),
      action: string().required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
      data: object().default({}),
    }).required().custom((event) => ({
      ...event,
      date: '$$NOW',
    })), params);
    return this.userLog.collection.updateOne({
      _id: { $lt: 0 },
    }, [{
      $replaceRoot: { newRoot: { $mergeObjects: [doc, '$$ROOT'] } },
    }], { upsert: true, session });
  }

  /**
   * @typedef LogoutMagicUserParams
   * @prop {string} authToken
   * @prop {string} [ip]
   * @prop {string} [ua]
   *
   * @param {LogoutMagicUserParams} params
   * @returns {Promise<string>}
   */
  async logoutMagicUser(params) {
    /** @type {LogoutMagicUserParams} */
    const { authToken: token, ip, ua } = await validateAsync(object({
      authToken: string().required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
    }).required(), params);

    const authToken = await this.token.verify({ token, subject: 'magic-auth' });
    const userId = get(authToken, 'doc.audience');
    const impersonated = get(authToken, 'doc.data.impersonated');
    const user = await this.findUserById({ _id: userId });

    const session = this.mongo.startSession();
    try {
      await session.withTransaction(async (activeSession) => {
        await this.token.invalidate({
          id: get(authToken, 'doc._id'),
          options: { session: activeSession },
        });

        await this.logAction({
          userId: user._id,
          action: 'logout-magic-user',
          ip,
          ua,
          data: { authToken, impersonated },
        }, { session: activeSession });
      });
      return 'ok';
    } finally {
      await session.endSession();
    }
  }

  /**
   * @typedef MagicLoginParams
   * @prop {string} loginToken
   * @prop {string} [ip]
   * @prop {string} [ua]
   *
   * @typedef MagicLoginResult
   * @prop {string} authToken
   * @prop {ObjectId} userId
   * @prop {import('@parameter1/sso-mongodb-token').TokenDocument} authDoc
   *
   * @param {MagicLoginParams} params
   * @returns {Promise<MagicLoginResult>}
   */
  async magicLogin(params) {
    /** @type {MagicLoginParams} */
    const { loginLinkToken: token, ip, ua } = await validateAsync(object({
      loginLinkToken: string().required(),
      ip: userLogProps.ip,
      ua: userLogProps.ua,
    }).required(), params);

    const loginLinkToken = await this.token.verify({ token, subject: 'magic-login-link' });
    const impersonated = get(loginLinkToken, 'doc.data.impersonated');
    const user = await this.findUserById({
      _id: get(loginLinkToken, 'doc.audience'),
      options: { projection: { email: 1 } },
    });

    const session = this.mongo.startSession();

    try {
      let result;
      await session.withTransaction(async (activeSession) => {
        const authToken = await this.getOrCreateAuthToken({
          userId: user._id,
          impersonated,
          session: activeSession,
        });

        await this.logAction({
          userId: user._id,
          action: 'magic-login',
          ip,
          ua,
          data: { loginLinkToken, authToken, impersonated },
        }, { session: activeSession });

        if (!impersonated) {
          await this.commands.magicLogin({
            input: [{ entityId: user._id }],
            session: activeSession,
          });
        }

        await this.token.invalidate({
          id: get(loginLinkToken, 'doc._id'),
          options: { session: activeSession },
        });

        result = {
          authToken: authToken.signed,
          userId: user._id,
          authDoc: authToken.doc,
        };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  /**
   * @typedef VerifyMagicAuthTokenParams
   * @prop {string} authToken
   * @prop {object} [projection]
   *
   * @param {VerifyMagicAuthTokenParams} params
   * @returns {Promise<import("mongodb").Document>}
   */
  async verifyMagicAuthToken(params) {
    /** @type {VerifyMagicAuthTokenParams} */
    const { authToken, projection } = await validateAsync(object({
      authToken: string().required(),
      projection: object().default({ _id: 1 }),
    }).required(), params);

    try {
      const { doc } = await this.token.verify({ token: authToken, subject: 'magic-auth' });
      const { audience: userId } = doc;
      const user = await this.findUserById({ _id: userId, options: { projection } });
      return user;
    } catch (e) {
      throw createError(401, `Authentication failed: ${e.message}`);
    }
  }
}
