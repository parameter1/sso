import { isFunction as isFn, objectHasKeys } from '@parameter1/utils';
import { PropTypes, validateAsync } from '@parameter1/prop-types';
import { get } from '@parameter1/object-path';

import AbstractManagementRepo from './-abstract.js';
import {
  contextSchema,
  organizationProps,
  tokenProps,
  userEventProps,
  userProps,
  userSchema,
  workspaceProps,
} from '../../schema/index.js';
import { sluggifyUserNames } from '../../schema/user.js';
import Expr from '../../pipelines/utils/expr.js';
import runTransaction from '../../utils/run-transaction.js';
import { buildMaterializedUserPipeline } from '../materializer.js';

const {
  $addToSet,
  $inc,
  $pull,
  $mergeArrayObject,
} = Expr;

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
        { key: { 'organizations._id': 1 } },
        { key: { 'workspaces._id': 1 } },

        { key: { 'slug.default': 1, _id: 1 } },
        { key: { 'slug.reverse': 1, _id: 1 } },
      ],
      schema: userSchema,
      materializedPipelineBuilder: buildMaterializedUserPipeline,
    });
  }

  /**
   * Adds a workspace membership for the provided user and workspace IDs.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.workspaceId
   * @param {string} params.role
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns
   */
  async joinWorkspace(params) {
    const {
      userId,
      workspaceId,
      role,
      session,
      context,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      workspaceId: workspaceProps.id.required(),
      role: workspaceProps.memberRole.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.update({
      filter: { _id: userId, 'workspaces._id': { $ne: workspaceId } },
      materializeFilter: { _id: userId },
      update: [{
        $set: {
          workspaces: $addToSet('workspaces', { _id: workspaceId, role }),
        },
      }],
      session,
      context,
    });
  }

  /**
   * Changes the role for an existing organization manager.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.workspaceId
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns
   */
  async leaveWorkspace(params) {
    const {
      userId,
      workspaceId,
      session,
      context,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      workspaceId: workspaceProps.id.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    return this.update({
      filter: { _id: userId, 'workspaces._id': workspaceId },
      materializeFilter: { _id: userId },
      update: [{
        $set: {
          workspaces: $pull('workspaces', { $ne: ['$$v._id', workspaceId] }),
        },
      }],
      session,
      context,
    });
  }

  /**
   * Adds an organization manager for the provided user and org IDs.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.orgId
   * @param {string} params.role
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns
   */
  async manageOrg(params) {
    const {
      userId,
      orgId,
      role,
      session,
      context,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      orgId: organizationProps.id.required(),
      role: organizationProps.managerRole.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.update({
      filter: { _id: userId, 'organizations._id': { $ne: orgId } },
      materializeFilter: { _id: userId },
      update: [{
        $set: {
          organizations: $addToSet('organizations', { _id: orgId, role }),
        },
      }],
      session,
      context,
    });
  }

  /**
   * Changes a user's email address for the provided ID.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {string} params.email
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns {Promise<BulkWriteResult>}
   */
  async changeEmailAddress(params) {
    const {
      id,
      email,
      session,
      context,
    } = await validateAsync(object({
      id: userProps.id.required(),
      email: userProps.email.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.update({
      filter: { _id: id, email: { $ne: email } },
      materializeFilter: { _id: id },
      many: false,
      update: [{
        $set: {
          domain: email.split('@')[1],
          email,
          verified: false,
          previousEmails: $pull($addToSet('previousEmails', '$email'), { $ne: ['$$v', email] }),
        },
      }],
      session,
      context,
    });
  }

  /**
   * Changes the role for an existing workspace member.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.workspaceId
   * @param {string} params.role
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns
   */
  async changeWorkspaceRole(params) {
    const {
      userId,
      workspaceId,
      role,
      session,
      context,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      workspaceId: workspaceProps.id.required(),
      role: workspaceProps.memberRole.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.update({
      filter: {
        _id: userId,
        workspaces: { $elemMatch: { _id: workspaceId, role: { $ne: role } } },
      },
      materializeFilter: { _id: userId },
      update: [{
        $set: {
          workspaces: $mergeArrayObject('workspaces', { $eq: ['$$v._id', workspaceId] }, { role }),
        },
      }],
      session,
      context,
    });
  }

  /**
   * Changes the role for an existing organization manager.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.orgId
   * @param {string} params.role
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns
   */
  async changeOrgRole(params) {
    const {
      userId,
      orgId,
      role,
      session,
      context,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      orgId: organizationProps.id.required(),
      role: organizationProps.managerRole.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.update({
      filter: {
        _id: userId,
        organizations: { $elemMatch: { _id: orgId, role: { $ne: role } } },
      },
      materializeFilter: { _id: userId },
      update: [{
        $set: {
          organizations: $mergeArrayObject('organizations', { $eq: ['$$v._id', orgId] }, { role }),
        },
      }],
      session,
      context,
    });
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
      email: userProps.email.required(),
      ip: userEventProps.ip,
      ua: userEventProps.ua,
      ttl: tokenProps.ttl.default(3600),
      scope: string(),
      impersonated: boolean().default(false),
      session: object(),
      inTransaction: func(),
    }).required(), params);

    return runTransaction(async ({ session }) => {
      const user = await this.findByEmail({
        email,
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
          user: { _id: user._id },
          action: 'send-login-link',
          ip,
          ua,
          data: { scope, loginToken: token, impersonated },
        },
        session,
      });

      if (isFn(inTransaction)) await inTransaction({ user, token });
      return token.signed;
    }, { currentSession, client: this.client });
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
   * @param {object} params
   * @param {string} params.authToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  async logout(params = {}) {
    const { authToken: token, ip, ua } = await validateAsync(object({
      authToken: string().required(),
      ip: userEventProps.ip,
      ua: userEventProps.ua,
    }).required(), params);

    const authToken = await this.manager.$('token').verify({ token, subject: 'auth' });
    const userId = get(authToken, 'doc.audience');
    const impersonated = get(authToken, 'doc.data.impersonated');

    return runTransaction(async ({ session }) => {
      const user = await this.findByObjectId({
        id: userId,
        options: { strict: true, projection: { _id: 1 }, session },
      });

      await Promise.all([
        this.manager.$('token').invalidate({ id: get(authToken, 'doc._id'), options: { session } }),
        this.manager.$('user-event').create({
          doc: {
            user: { _id: user._id },
            action: 'logout',
            ip,
            ua,
            data: { authToken, impersonated },
          },
          session,
        }),
        impersonated ? Promise.resolve() : this.update({
          filter: { _id: user._id },
          many: false,
          update: [{ $set: { lastSeenAt: '$$NOW' } }],
          versioningEnabled: false,
        }),
      ]);
      await session.commitTransaction();
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

    return runTransaction(async ({ session }) => {
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
            user: { _id: user._id },
            action: 'magic-login',
            ip,
            ua,
            data: { loginLinkToken, authToken, impersonated },
          },
          session,
        }),
        impersonated ? Promise.resolve() : this.update({
          filter: { _id: user._id },
          update: [{
            $set: {
              lastLoggedInAt: '$$NOW',
              lastSeenAt: '$$NOW',
              loginCount: $inc('loginCount', 1),
              verified: true,
            },
          }],
          session,
        }),
      ]);

      return {
        authToken: authToken.signed,
        userId: user._id,
        authDoc: authToken.doc,
      };
    }, { client: this.client });
  }

  /**
   * Changes the role for an existing organization manager.
   *
   * @param {object} params
   * @param {ObjectId|string} params.userId
   * @param {ObjectId|string} params.orgId
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns
   */
  async unmanageOrg(params) {
    const {
      userId,
      orgId,
      session,
      context,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      orgId: organizationProps.id.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    return this.update({
      filter: { _id: userId, 'organizations._id': orgId },
      materializeFilter: { _id: userId },
      update: [{
        $set: {
          organizations: $pull('organizations', { $ne: ['$$v._id', orgId] }),
        },
      }],
      session,
      context,
    });
  }

  /**
   * Changes a user's given/family name for the provided ID.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {string} params.givenName
   * @param {string} params.familyName
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns {Promise<BulkWriteResult>}
   */
  async updateName(params) {
    const {
      id,
      givenName,
      familyName,
      session,
      context,
    } = await validateAsync(object({
      id: userProps.id.required(),
      givenName: userProps.givenName.required(),
      familyName: userProps.familyName.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const names = [givenName, familyName];
    return this.update({
      filter: {
        _id: id,
        $or: [
          { givenName: { $ne: givenName } },
          { familyName: { $ne: familyName } },
        ],
      },
      materializeFilter: { _id: id },
      update: [{
        $set: {
          givenName,
          familyName,
          'slug.default': sluggifyUserNames(names),
          'slug.reverse': sluggifyUserNames(names, true),
        },
      }],
      session,
      context,
    });
  }

  /**
   * @param {object} params
   * @param {string} params.authToken
   * @param {object} [params.projection]
   */
  async verifyAuthToken(params = {}) {
    const { authToken, projection } = await validateAsync(object({
      authToken: string().required(),
      projection: object(),
    }).required(), params);
    try {
      const { doc } = await this.manager.$('token').verify({ token: authToken, subject: 'auth' });
      const { audience: userId } = doc;
      const impersonated = get(doc, 'data.impersonated');

      const user = await this.findByObjectId({
        id: userId,
        options: { projection, strict: true },
      });

      if (!impersonated) {
        await this.update({
          filter: { _id: user._id },
          update: [{ $set: { lastSeenAt: '$$NOW' } }],
          versioningEnabled: false,
        });
      }
      return user;
    } catch (e) {
      throw AbstractManagementRepo.createError(401, `Authentication failed: ${e.message}`);
    }
  }
}
