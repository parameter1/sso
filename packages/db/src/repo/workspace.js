import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as appAttrs,
  organizationAttributes as orgAttrs,
  userAttributes as userAttrs,
  workspaceAttributes as attrs,
} from '../schema/attributes/index.js';
import DenormalizationManager from '../dnz-manager/index.js';

import { buildUpdatePipeline } from './pipelines/index.js';
import { slugRedirects } from './pipelines/build/index.js';

export default class WorkspaceRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'workspaces',
      collatableFields: [],
      indexes: [
        { key: { 'org._id': 1, 'app._id': 1, slug: 1 }, unique: true },
        { key: { redirects: 1 } },
      ],
    });

    this.dnzManager = new DenormalizationManager({
      repoManager: this.manager,
      globalFields: [
        // @todo vet schema and required prop usage
        { name: 'name', schema: attrs.name, required: true },
        { name: 'slug', schema: attrs.slug, required: true },
      ],
      // @todo automatically update `date.updated`??
      definitions: [
        ['application::workspaces', { subPath: null, isArray: true }],
        ['organization::workspaces', { subPath: null, isArray: true }],
        ['user::memberships', { subPath: 'workspace', isArray: true }],
      ],
    });
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
  async addMember(params = {}) {
    const {
      workspace,
      user,
      role,
    } = await validateAsync(Joi.object({
      workspace: Joi.object({
        _id: attrs.id.required(),
        slug: attrs.slug.required(),
        name: Joi.string().required(),
        urls: attrs.urls.required(),
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
        this.updateOne({
          query: { _id: workspace._id, 'members.user._id': { $ne: user._id } },
          update: {
            $set: { 'date.updated': now },
            $addToSet: {
              members: cleanDocument({ user, role, date: { added: now, updated: now } }),
            },
          },
          options,
        }),
        this.manager.$('user').updateOne({
          query: { _id: user._id, 'memberships.workspace._id': { $ne: workspace._id } },
          update: {
            $set: { 'date.updated': now },
            $addToSet: {
              memberships: cleanDocument({ workspace, role, date: { added: now, updated: now } }),
            },
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
   * @param {ObjectId} params.workspaceId
   * @param {ObjectId} params.userId
   * @param {string} params.role
   */
  async changeMemberRole(params = {}) {
    const {
      workspaceId,
      userId,
      role,
    } = await validateAsync(Joi.object({
      workspaceId: attrs.id.required(),
      userId: userAttrs.id.required(),
      role: attrs.role.required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true, session };

    try {
      const results = await Promise.all([
        this.updateOne({
          query: {
            _id: workspaceId,
            members: { $elemMatch: { 'user._id': userId, role: { $ne: role } } },
          },
          update: {
            $set: {
              'members.$[elem].role': role,
              'members.$[elem].date.updated': now,
              'date.updated': now,
            },
          },
          options: {
            ...options,
            arrayFilters: [{ 'elem.user._id': userId }],
          },
        }),
        this.manager.$('user').updateOne({
          query: {
            _id: userId,
            memberships: { $elemMatch: { 'workspace._id': workspaceId, role: { $ne: role } } },
          },
          update: {
            $set: {
              'memberships.$[elem].role': role,
              'memberships.$[elem].date.updated': now,
              'date.updated': now,
            },
          },
          options: {
            ...options,
            arrayFilters: [{ 'elem.workspace._id': workspaceId }],
          },
        }),
      ]);
      await session.commitTransaction();
      return results;
    } catch (e) {
      await session.abortTransaction();
      if (e.statusCode === 404) {
        e.statusCode = 400;
        e.message = 'Either no record was found for the provided criteria or this user does not a have the requested management role for this org.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * @param {object} params
   *
   * @param {object} params.app
   * @param {ObjectId} params.app._id
   * @param {string} params.app.slug
   * @param {string} params.app.name
   *
   * @param {object} params.org
   * @param {ObjectId} params.org._id
   * @param {string} params.org.slug
   * @param {string} params.org.name
   *
   * @param {string} params.slug
   * @param {string} params.name
   *
   * @param {object[]} params.urls
   */
  async create(params = {}) {
    const {
      app,
      org,
      slug,
      name,
      urls,
    } = await validateAsync(Joi.object({
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
      slug: attrs.slug.required(),
      name: attrs.name.required(),
      urls: attrs.urls.required(),
    }).required(), params);

    await this.throwIfSlugHasRedirect({ slug, appId: app._id, orgId: org._id });

    const now = new Date();
    const doc = cleanDocument({
      app,
      org,
      slug,
      name,
      urls,
      date: {
        created: now,
        updated: now,
      },
      members: [],
      redirects: [],
    }, { preserveEmptyArrays: true });

    const session = await this.client.startSession();
    session.startTransaction();

    const options = { strict: true, session };
    try {
      const workspace = await this.insertOne({ doc, options });
      const rel = { _id: workspace._id, name: workspace.name, slug: workspace.slug };

      await Promise.all([
        this.manager.$('application').pushRelatedWorkspace({
          appId: app._id,
          workspace: { ...rel, org: workspace.org },
          options,
        }),
        this.manager.$('organization').pushRelatedWorkspace({
          orgId: org._id,
          workspace: { ...rel, app: workspace.app },
          options,
        }),
      ]);

      await session.commitTransaction();
      return workspace;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.workspaceId
   * @param {ObjectId} params.userId
   */
  async removeMember(params = {}) {
    const {
      workspaceId,
      userId,
    } = await validateAsync(Joi.object({
      workspaceId: attrs.id.required(),
      userId: userAttrs.id.required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true, session };
    try {
      const results = await Promise.all([
        this.updateOne({
          query: { _id: workspaceId, 'members.user._id': userId },
          update: {
            $set: { 'date.updated': now },
            $pull: { members: { 'user._id': userId } },
          },
          options,
        }),
        this.manager.$('user').updateOne({
          query: { _id: userId, 'memberships.workspace._id': workspaceId },
          update: {
            $set: { 'date.updated': now },
            $pull: { memberships: { 'workspace._id': workspaceId } },
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
        e.message = 'Either no record was found for the provided criteria or this user is not a member of this workspace.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} [params.id]
   * @param {string} params.slug
   * @param {ObjectId} params.appId
   * @param {ObjectId} params.orgId
   */
  async throwIfSlugHasRedirect(params = {}) {
    const {
      id,
      slug,
      appId,
      orgId,
    } = await validateAsync(Joi.object({
      id: attrs.id,
      slug: attrs.slug.required(),
      appId: appAttrs.id.required(),
      orgId: orgAttrs.id.required(),
    }).required(), params);
    return this.manager.throwIfSlugHasRedirect({
      repo: 'workspace',
      id,
      slug,
      query: { 'app._id': appId, 'org._id': orgId },
    });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   * @param {string} [params.slug]
   * @param {ObjectId} [params.appId]
   * @param {ObjectId} [params.orgId]
   */
  async updateAttributes(params = {}) {
    const {
      id,
      name,
      slug,

      appId,
      orgId,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      name: attrs.name,
      slug: attrs.slug,

      appId: Joi.when('slug', { is: /^.+/, then: appAttrs.id.required() }),
      orgId: Joi.when('slug', { is: /^.+/, then: orgAttrs.id.required() }),
    }).required(), params);

    const fields = [];
    if (name) fields.push({ path: 'name', value: name });
    if (slug) {
      await this.throwIfSlugHasRedirect({
        id,
        slug,
        appId,
        orgId,
      });
      fields.push({ path: 'slug', value: slug, set: () => slugRedirects(slug) });
    }
    if (!fields.length) return null; // noop

    const session = await this.client.startSession();
    session.startTransaction();
    try {
      // attempt to update the app.
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
          values: { name, slug },
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
}
