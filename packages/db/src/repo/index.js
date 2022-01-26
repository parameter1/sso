import { RepoManager, cleanDocument, ManagedRepo } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';

import ApplicationRepo from './application.js';
import OrganizationRepo from './organization.js';
import TokenRepo from './token.js';
import UserEventRepo from './user-event.js';
import UserRepo from './user.js';
import WorkspaceRepo from './workspace.js';

import { buildUpdateSlugPipeline } from './pipelines/index.js';

import {
  applicationAttributes as appAttrs,
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

  /**
   *
   * @param {object} params
   * @param {object} params.workspace
   * @param {object} params.workspace.app
   * @param {object} params.workspace.org
   * @param {object} params.user
   * @param {string} params.role
   */
  async addWorkspaceMember(params = {}) {
    const {
      workspace,
      user,
      role,
    } = await validateAsync(Joi.object({
      workspace: Joi.object({
        _id: workspaceAttrs.id.required(),
        slug: workspaceAttributes.slug.required(),
        name: Joi.string().required(),
        app: Joi.object({
          _id: appAttrs.id.required(),
          slug: appAttrs.slug.required(),
          name: appAttrs.name.required(),
        }).required(),
        org: Joi.object({
          _id: orgAttrs.id.required(),
          slug: orgAttrs.slug.required(),
          name: orgAttrs.name.required(),
        }).required(),
      }).required(),
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email.required(),
        familyName: userAttrs.familyName.required(),
        givenName: userAttrs.givenName.required(),
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
            $set: { 'date.updated': now },
            $push: { members: cleanDocument({ user, role, date: { added: now } }) },
          },
          options,
        }),
        this.$('user').updateOne({
          query: { _id: user._id, 'memberships.workspace._id': { $ne: workspace._id } },
          update: {
            $set: { 'date.updated': now },
            $push: { memberships: cleanDocument({ workspace, role, date: { added: now } }) },
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

  /**
   *
   * @param {object} params
   * @param {string} params.repo
   * @param {string} params.slug
   * @param {object} [params.query] Optional query criteria to apply
   */
  async prepareSlugUpdatePipeline(params = {}) {
    const {
      repo,
      id,
      slug,
      query,
    } = await validateAsync(Joi.object({
      repo: Joi.string().required(),
      id: Joi.objectId().required(),
      slug: Joi.slug().required(),
      query: Joi.object().default({}),
    }).required(), params);

    await this.throwIfSlugHasRedirect({
      repo,
      id,
      slug,
      query,
    });
    return buildUpdateSlugPipeline({ slug });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.repo The repository key name to query
   * @param {ObjectId} [params.id] If passed, will exclude the related doc from the query
   * @param {string} params.slug The slug to check
   * @param {object} [params.query] Optional query criteria to apply
   */
  async slugHasRedirect(params = {}) {
    const {
      repo,
      id,
      slug,
      query,
    } = await validateAsync(Joi.object({
      repo: Joi.string().required(),
      id: Joi.objectId(),
      slug: Joi.slug().required(),
      query: Joi.object().default({}),
    }).required(), params);

    const doc = await this.$(repo).findOne({
      query: {
        ...query,
        redirects: slug,
        ...(id && { _id: { $ne: id } }),
      },
      options: { projection: { _id: 1 } },
    });
    return Boolean(doc);
  }

  /**
   *
   * @param {object} params
   * @param {string} params.repo The repository key name to query
   * @param {ObjectId} [params.id] If passed, will exclude the related doc from the check
   * @param {string} params.slug The slug to check
   * @param {object} [params.query] Optional query criteria to apply
   */
  async throwIfSlugHasRedirect(params = {}) {
    const {
      repo,
      id,
      slug,
      query,
    } = await validateAsync(Joi.object({
      repo: Joi.string().required(),
      id: Joi.objectId(),
      slug: Joi.slug().required(),
      query: Joi.object().default({}),
    }).required(), params);

    const hasRedirect = await this.slugHasRedirect({
      repo,
      id,
      slug,
      query,
    });
    if (hasRedirect) throw ManagedRepo.createError(409, 'An existing record is already using this slug as a redirect.');
  }
}
