import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import { isFunction as isFn, objectHasKeys } from '@parameter1/utils';
import { get } from '@parameter1/object-path';
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
      ],
    });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.email
   * @param {boolean} [params.verfied=false]
   */
  async changeEmailAddress(params = {}) {
    const {
      id,
      email,
      verified,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      email: attrs.email.required(),
      verified: attrs.verified.default(false),
    }).required(), params);

    const user = await this.findByObjectId({ id, options: { projection: { email: 1 } } });
    if (user.email === email) {
      throw ManagedRepo.createError(400, 'The new email address is the same as the current email address.');
    }

    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the user email.
      await this.updateOne({
        query: { _id: user._id },
        update: {
          $set: cleanDocument({
            email,
            domain: email.split('@')[1],
            'date.updated': new Date(),
            verified,
          }),
        },
        options: { strict: true, session },
      });

      // then update relationships.
      await Promise.all([
        // org managers
        this.manager.$('organization').updateMany({
          query: { 'managers.user._id': user._id },
          update: { $set: { 'managers.$[elem].user.email': email } },
          options: {
            arrayFilters: [{ 'elem.user._id': user._id }],
            session,
          },
        }),
        // workspace members
        this.manager.$('workspace').updateMany({
          query: { 'members.user._id': user._id },
          update: { $set: { 'members.$[elem].user.email': email } },
          options: {
            arrayFilters: [{ 'elem.user._id': user._id }],
            session,
          },
        }),
        // user events
        this.manager.$('user-event').updateMany({
          query: { 'user._id': user._id },
          update: { $set: { 'user.email': email } },
          options: { session },
        }),
      ]);

      await session.commitTransaction();
      return 'ok';
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.givenName
   * @param {string} params.familyName
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
      familyName: attrs.familyName.required(),
      givenName: attrs.givenName.required(),
      verified: attrs.verified.default(false),
      options: Joi.object().default({}),
    }).required(), params);

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        email,
        domain: email.split('@')[1],
        name: {
          default: UserRepo.createFullName({ givenName, familyName }),
          given: givenName,
          family: familyName,
        },
        verified,
        loginCount: 0,
        date: {
          created: now,
          updated: now,
        },
        manages: [],
        memberships: [],
      }, { preserveEmptyArrays: true }),
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
    } = await validateAsync(Joi.object({
      email: attrs.email.required(),
      ip: eventAttrs.ip,
      ua: eventAttrs.ua,
      ttl: tokenAttrs.ttl.default(3600),
      scope: Joi.string(),
      impersonated: Joi.boolean().default(false),
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

      const data = {
        ...(scope && { scope }),
        ...(impersonated && { impersonated }),
      };

      const token = await this.manager.$('token').create({
        subject: 'login-link',
        audience: user._id,
        ttl,
        ...(objectHasKeys(data) && { data }),
        options: { session },
      });

      const { signed } = token;
      await this.manager.$('user-event').create({
        user,
        action: 'send-login-link',
        ip,
        ua,
        data: { scope, loginToken: token, impersonated },
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

  /**
   * @param {object} params
   * @param {string} params.authToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  async logout(params = {}) {
    const { authToken: token, ip, ua } = await validateAsync(Joi.object({
      authToken: Joi.string().required(),
      ip: eventAttrs.ip,
      ua: eventAttrs.ua,
    }).required(), params);

    const authToken = await this.manager.$('token').verify({ token, subject: 'auth' });
    const userId = get(authToken, 'doc.audience');
    const impersonated = get(authToken, 'doc.data.impersonated');
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      const user = await this.findByObjectId({
        id: userId,
        options: { strict: true, projection: { email: 1 }, session },
      });

      await Promise.all([
        this.manager.$('token').invalidate({ id: get(authToken, 'doc._id'), options: { session } }),
        this.manager.$('user-event').create({
          user,
          action: 'logout',
          ip,
          ua,
          data: { authToken, impersonated },
          options: { session },
        }),
        impersonated ? Promise.resolve() : this.updateOne({
          query: { _id: userId },
          update: { $set: { 'date.lastSeen': new Date() } },
          options: { session },
        }),
      ]);
      await session.commitTransaction();
      return 'ok';
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * @param {object} params
   * @param {string} params.loginToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  async magicLogin(params = {}) {
    const {
      loginLinkToken: token,
      ip,
      ua,
    } = await validateAsync(Joi.object({
      loginLinkToken: Joi.string().required(),
      ip: eventAttrs.ip,
      ua: eventAttrs.ua,
    }).required(), params);

    try {
      const loginLinkToken = await this.manager.$('token').verify({ token, subject: 'login-link' });
      const shouldInvalidateToken = get(loginLinkToken, 'doc.data.scope') !== 'invite';
      const impersonated = get(loginLinkToken, 'doc.data.impersonated');
      const user = await this.findByObjectId({
        id: get(loginLinkToken, 'doc.audience'),
        options: { projection: { email: 1 }, strict: true },
      });

      const session = await this.client.startSession();
      session.startTransaction();
      try {
        const authToken = await this.manager.$('token').getOrCreateAuthToken({
          userId: user._id,
          impersonated,
          options: { session },
          findOptions: { session },
        });
        const now = new Date();
        const $set = { verified: true, 'date.lastLoggedIn': now, 'date.lastSeen': now };

        await Promise.all([
          ...(shouldInvalidateToken ? [
            this.manager.$('token').invalidate({ id: get(loginLinkToken, 'doc._id'), options: { session } }),
          ] : []),
          this.manager.$('user-event').create({
            user,
            action: 'magic-login',
            date: now,
            ip,
            ua,
            data: { loginLinkToken, authToken, impersonated },
            options: { session },
          }),
          impersonated ? Promise.resolve() : this.updateOne({
            query: { _id: user._id },
            update: { $set, $inc: { loginCount: 1 } },
            options: { session },
          }),
        ]);

        await session.commitTransaction();
        return {
          authToken: authToken.signed,
          userId: user._id,
          authDoc: authToken.doc,
        };
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }
    } catch (e) {
      e.message = `Unable to login: ${e.message}`;
      throw e;
    }
  }

  /**
   * @param {object} params
   * @param {string} params.givenName
   * @param {string} params.familyName
   */
  async updateName(params = {}) {
    const {
      id,
      givenName,
      familyName,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      givenName: attrs.givenName.required(),
      familyName: attrs.familyName.required(),
      options: Joi.object().default({}),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const name = cleanDocument({
      default: UserRepo.createFullName({ givenName, familyName }),
      given: givenName,
      family: familyName,
    });

    try {
      // attempt to update the user.
      const result = await this.updateOne({
        query: { _id: id },
        update: { $set: { name, 'date.updated': new Date() } },
        options: { strict: true, session },
      });

      // then update relationships.
      await Promise.all([
        // org managers
        this.manager.$('organization').updateMany({
          query: { 'managers.user._id': id },
          update: { $set: { 'managers.$[elem].user.name': name } },
          options: {
            arrayFilters: [{ 'elem.user._id': id }],
            session,
          },
        }),
        // workspace members
        this.manager.$('workspace').updateMany({
          query: { 'members.user._id': id },
          update: { $set: { 'members.$[elem].user.name': name } },
          options: {
            arrayFilters: [{ 'elem.user._id': id }],
            session,
          },
        }),
      ]);

      await session.commitTransaction();
      return result;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * @param {object} params
   * @param {string} params.authToken
   * @param {object} [params.projection]
   */
  async verifyAuthToken(params = {}) {
    const { authToken, projection } = await validateAsync(Joi.object({
      authToken: Joi.string().required(),
      projection: Joi.object().default({}),
    }).required(), params);
    try {
      const { doc } = await this.manager.$('token').verify({ token: authToken, subject: 'auth' });
      const { audience: userId } = doc;
      const impersonated = get(doc, 'data.impersonated');
      if (!impersonated) {
        await this.updateOne({
          query: { _id: userId },
          update: { $set: { 'date.lastSeen': new Date() } },
        });
      }
      const user = await this.findByObjectId({
        id: userId,
        options: { projection, strict: true },
      });
      return user;
    } catch (e) {
      throw ManagedRepo.createError(401, `Authentication failed: ${e.message}`);
    }
  }

  static createFullName({ givenName, familyName } = {}) {
    return [givenName, familyName].filter((v) => v).join(' ');
  }
}
