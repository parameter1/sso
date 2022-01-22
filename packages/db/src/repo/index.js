import { RepoManager, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';

import ApplicationRepo from './application.js';
import OrganizationRepo from './organization.js';
import TokenRepo from './token.js';
import UserEventRepo from './user-event.js';
import UserRepo from './user.js';
import WorkspaceRepo from './workspace.js';

import {
  organizationAttributes as orgAttrs,
  userAttributes as userAttrs,
  workspaceAttributes,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';

export default class Repos extends RepoManager {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} [params.dbBame=tenancy]
   * @param {string} params.tokenSecret
   */
  constructor({ client, dbName = 'tenancy', tokenSecret } = {}) {
    super({ client, dbName });
    this
      .add({ key: 'application', ManagedRepo: ApplicationRepo })
      .add({ key: 'organization', ManagedRepo: OrganizationRepo })
      .add({ key: 'token', ManagedRepo: TokenRepo, tokenSecret })
      .add({ key: 'user', ManagedRepo: UserRepo })
      .add({ key: 'user-event', ManagedRepo: UserEventRepo })
      .add({ key: 'workspace', ManagedRepo: WorkspaceRepo });
  }

  async addOrgManager(params = {}) {
    const {
      org,
      user,
      role,
    } = await validateAsync(Joi.object({
      org: Joi.object({
        _id: orgAttrs.id.required(),
        slug: orgAttrs.slug.required(),
      }).required(),
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email.required(),
      }).required(),
      role: orgAttrs.managerRole.required(),
      options: Joi.object().default({}),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true };
    try {
      const results = await Promise.all([
        this.$('organization').updateOne({
          query: { _id: org._id, 'managers.user._id': { $ne: user._id } },
          update: {
            $set: { updatedAt: now },
            $push: { managers: cleanDocument({ user, role, addedAt: now }) },
          },
          options,
        }),
        this.$('user').updateOne({
          query: { _id: user._id, 'manages.org._id': { $ne: org._id } },
          update: {
            $set: { updatedAt: now },
            $push: { manages: cleanDocument({ org, role, addedAt: now }) },
          },
          options,
        }),
      ]);
      await session.commitTransaction();
      return results;
    } catch (e) {
      await session.abortTransaction();
      if (e.statusCode === 404) {
        e.statusCode = 400;
        e.message = 'Either no records were found for the provided criteria or this user is already a manager of this org.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  async addWorkspaceMember(params = {}) {
    const {
      workspace,
      user,
      role,
    } = await validateAsync(Joi.object({
      workspace: Joi.object({
        _id: workspaceAttrs.id.required(),
        namespace: workspaceAttributes.namespace.required(),
        slug: workspaceAttributes.slug.required(),
      }).required(),
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email.required(),
      }).required(),
      role: Joi.string().required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true };
    try {
      const results = await Promise.all([
        this.$('workspace').updateOne({
          query: { _id: workspace._id, 'members.user._id': { $ne: user._id } },
          update: {
            $set: { updatedAt: now },
            $push: { members: cleanDocument({ user, role, addedAt: now }) },
          },
          options,
        }),
        this.$('user').updateOne({
          query: { _id: user._id, 'memberships.workspace._id': { $ne: workspace._id } },
          update: {
            $set: { updatedAt: now },
            $push: { memberships: cleanDocument({ workspace, role, addedAt: now }) },
          },
          options,
        }),
      ]);
      await session.commitTransaction();
      return results;
    } catch (e) {
      await session.abortTransaction();
      if (e.statusCode === 404) {
        e.statusCode = 400;
        e.message = 'Either no records were found for the provided criteria or this user is already a member of this workspace.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }
}
