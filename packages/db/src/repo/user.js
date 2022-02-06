import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import { isFunction as isFn, objectHasKeys } from '@parameter1/utils';
import { get } from '@parameter1/object-path';
import {
  userAttributes as attrs,
  userEventAttributes as eventAttrs,
  tokenAttributes as tokenAttrs,
} from '../schema/attributes/index.js';
import DenormalizationManager from '../dnz-manager/index.js';

import { buildUpdatePipeline } from './pipelines/index.js';
import { userEmails } from './pipelines/build/index.js';

export default class UserRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'users',
      collatableFields: ['email', 'familyName'],
      indexes: [
        { key: { email: 1 }, unique: true, collation: { locale: 'en_US' } },

        { key: { familyName: 1, _id: 1 }, collation: { locale: 'en_US' } },
      ],
    });

    const emailField = { name: 'email', schema: attrs.email, required: true };
    this.dnzManager = new DenormalizationManager({
      repoManager: this.manager,
      globalFields: [
        // @todo vet schema and required prop usage
        emailField,
        { name: 'givenName', schema: attrs.givenName, required: true },
        { name: 'familyName', schema: attrs.familyName, required: true },
      ],
      // @todo automatically update `date.updated`??
      definitions: [
        ['organization::managers', { subPath: 'user', isArray: true }],
        ['user-event::user', { suppressGlobals: true, fields: [emailField] }],
        ['workspace::members', { subPath: 'user', isArray: true }],
      ],
    });
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
        givenName,
        familyName,
        verified,
        loginCount: 0,
        date: {
          created: now,
          updated: now,
        },
        manages: [],
        memberships: [],
        previousEmails: [],
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
        ttl: impersonated ? 60 : ttl,
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
        // @todo this should use the update pipeline and change the date.updated
        // value when `verified` changes.
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
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.email]
   * @param {string} [params.givenName]
   * @param {string} [params.familyName]
   */
  async updateAttributes(params = {}) {
    const {
      id,
      email,
      givenName,
      familyName,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      email: attrs.email,
      givenName: attrs.givenName,
      familyName: attrs.familyName,
    }).required(), params);

    const fields = [];
    if (givenName) fields.push({ path: 'givenName', value: givenName });
    if (familyName) fields.push({ path: 'familyName', value: familyName });
    if (email) {
      fields.push({
        path: 'email',
        value: email,
        set: () => userEmails(email),
      });
    }
    if (!fields.length) return null; // noop

    const session = await this.client.startSession();
    session.startTransaction();
    try {
      // attempt to update the user.
      const result = await this.updateOne({
        query: { _id: id },
        update: buildUpdatePipeline(fields),
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;
      const { dnzManager } = this;
      await dnzManager.executeRepoBulkOps({
        repoBulkOps: dnzManager.buildRepoBulkOpsFor({
          id,
          values: {
            email,
            givenName,
            familyName,
          },
        }),
        options: { session },
      });

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
}
