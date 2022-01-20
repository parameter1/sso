import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import { isFunction as isFn } from '@parameter1/utils';
import {
  userAttributes as attrs,
  userEventAttributes as eventAttrs,
  tokenAttributes as tokenAttrs,
} from '../schema/attributes/index.js';

export default class UserRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'users',
      collatableFields: ['email', 'name.family'],
      indexes: [
        { key: { email: 1 }, unique: true, collation: { locale: 'en_US' } },

        { key: { 'name.family': 1, _id: 1 }, collation: { locale: 'en_US' } },
        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }

  /**
   * @param {object} params
   * @param {string} params.email
   * @param {string} [params.givenName]
   * @param {string} [params.familyName]
   * @param {boolean} [params.verified]
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      email,
      familyName,
      givenName,
      verified,
      options,
    } = await validateAsync(Joi.object({
      email: attrs.email.required(),
      familyName: attrs.familyName.allow(null).empty(null),
      givenName: attrs.givenName.allow(null).empty(null),
      verified: attrs.verified.default(false),
      options: Joi.object().default({}),
    }).required(), params);

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        email,
        domain: email.split('@')[1],
        name: {
          given: givenName,
          family: familyName,
          full: [givenName, familyName].filter((v) => v).join(' '),
        },
        verified,
        loginCount: 0,
        date: { created: now, updated: now },
      }),
      options,
    });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.email
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   * @param {string} [params.ttl=3600]
   * @param {string} [params.scope]
   * @param {function} [params.inTransaction]
   */
  async createLoginLinkToken(params = {}) {
    const {
      email,
      ip,
      ua,
      ttl,
      scope,
      session: currentSession,
      inTransaction,
    } = await validateAsync(Joi.object({
      email: attrs.email.required(),
      ip: eventAttrs.ip,
      ua: eventAttrs.ua,
      ttl: tokenAttrs.ttl.default(3600),
      scope: Joi.string(),
      session: Joi.object(),
      inTransaction: Joi.function(),
    }).required(), params);

    const session = currentSession || await this.client.startSession();
    const previouslyStarted = session.inTransaction();
    if (!previouslyStarted) session.startTransaction();

    try {
      const user = await this.findByEmail({
        email,
        options: { strict: true, projection: { email: 1 }, session },
      });

      const token = await this.manager.$('token').create({
        subject: 'login-link',
        audience: user._id,
        ttl,
        ...(scope && { data: { scope } }),
        options: { session },
      });

      const { signed } = token;
      await this.manager.$('user-event').create({
        user,
        action: 'send-login-link',
        ip,
        ua,
        data: { scope, loginToken: token },
        options: { session },
      });

      if (isFn(inTransaction)) await inTransaction({ user, token });
      if (!previouslyStarted) await session.commitTransaction();
      return signed;
    } catch (e) {
      if (!previouslyStarted) await session.abortTransaction();
      throw e;
    } finally {
      if (!previouslyStarted) session.endSession();
    }
  }

  /**
   * Finds a user by email address.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {object} [params.options]
   */
  findByEmail({ email, options } = {}) {
    return this.findOne({ query: { email }, options });
  }
}
