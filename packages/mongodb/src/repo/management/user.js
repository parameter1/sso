import { isFunction as isFn, objectHasKeys } from '@parameter1/utils';
import { PropTypes, validateAsync } from '@sso/prop-types';
import { get } from '@parameter1/object-path';

import AbstractManagementRepo from './-abstract.js';
import {
  tokenProps,
  userEventProps,
  userProps,
  userSchema,
} from '../../schema/index.js';
import { buildUpdatePipeline, Expr } from '../../pipelines/index.js';
import { userEmails } from '../../pipelines/build/index.js';

const {
  boolean,
  func,
  object,
  string,
} = PropTypes;

export default class UserRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'users',
      collatableFields: [],
      indexes: [
        { key: { email: 1 }, unique: true },

        { key: { givenName: 1, familyName: 1, _id: 1 }, collation: { locale: 'en_US' } },
        { key: { familyName: 1, givenName: 1, _id: 1 }, collation: { locale: 'en_US' } },
      ],
      schema: userSchema,

      onPropUpdate: {
        email: ({ value }) => {
          if (!value) return null;
          return { path: 'email', value, set: () => userEmails(value) };
        },
      },
    });
  }

  /**
   * Creates a magic login link token for the provided user ID.
   *
   * @param {object} params
   * @param {string} params.userId
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   * @param {string} [params.ttl=3600]
   * @param {string} [params.scope]
   * @param {boolean} [params.impersonated=false]
   * @param {function} [params.inTransaction]
   */
  async createLoginLinkToken(params = {}) {
    const {
      userId,
      ip,
      ua,
      ttl,
      scope,
      impersonated,
      session: currentSession,
      inTransaction,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      ip: userEventProps.ip,
      ua: userEventProps.ua,
      ttl: tokenProps.ttl.default(3600),
      scope: string(),
      impersonated: boolean().default(false),
      session: object(),
      inTransaction: func(),
    }).required(), params);

    const session = currentSession || await this.client.startSession();
    const previouslyStarted = session.inTransaction();
    if (!previouslyStarted) session.startTransaction();

    try {
      const user = await this.findByObjectId({
        id: userId,
        options: { strict: true, projection: { email: 1 }, session },
      });

      const data = { ...(scope && { scope }), ...(impersonated && { impersonated }) };

      const token = await this.manager.$('token').createAndSignToken({
        doc: {
          subject: 'login-link',
          audience: user._id,
          ttl: impersonated ? 60 : ttl,
          ...(objectHasKeys(data) && { data }),
        },
        session,
      });

      await this.manager.$('user-event').create({
        doc: {
          userId: user._id,
          action: 'send-login-link',
          ip,
          ua,
          data: { scope, loginToken: token, impersonated },
        },
        session,
      });

      if (isFn(inTransaction)) await inTransaction({ user, token });
      if (!previouslyStarted) await session.commitTransaction();
      return token.signed;
    } catch (e) {
      if (!previouslyStarted) await session.abortTransaction();
      throw e;
    } finally {
      if (!previouslyStarted) session.endSession();
    }
  }

  /**
   * Finds a single user by email address.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {object} [params.options]
   */
  findByEmail({ email, options } = {}) {
    return this.findOne({ query: { email }, options });
  }

  /**
   * Magically logs a user in using the provided login token.
   *
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
    } = await validateAsync(object({
      loginLinkToken: string().required(),
      ip: userEventProps.ip,
      ua: userEventProps.ua,
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
        session,
      });

      await Promise.all([
        ...(shouldInvalidateToken ? [
          this.manager.$('token').invalidate({ id: get(loginLinkToken, 'doc._id'), options: { session } }),
        ] : []),
        this.manager.$('user-event').create({
          doc: {
            userId: user._id,
            action: 'magic-login',
            ip,
            ua,
            data: { loginLinkToken, authToken, impersonated },
          },
          session,
        }),
        impersonated ? Promise.resolve() : this.updateOne({
          query: { _id: user._id },
          // @todo handle these in updateProps
          // need to determine how to handle `Expr` calls
          // or is there an abstract method that just builds the fields that we send??
          update: buildUpdatePipeline([
            { path: 'verified', value: true },
            { path: 'lastLoggedInAt', value: '$$NOW' },
            { path: 'lastSeenAt', value: '$$NOW' },
            { path: 'loginCount', value: new Expr({ $add: ['$loginCount', 1] }) },
          ], {
            // only change version when verified flag changes
            isVersioned: this.isVersioned,
            source: this.source,
            versionCondition: '$__will_change.verified',
          }),
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
}
