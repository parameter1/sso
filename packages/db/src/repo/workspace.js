import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as appAttrs,
  organizationAttributes as orgAttrs,
  userAttributes as userAttrs,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';

import { buildUpdateNamePipeline } from './pipelines/index.js';

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
      // urls,
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
      slug: workspaceAttrs.slug.required(),
      name: workspaceAttrs.name.required(),
      // urls: Joi.array().items(
      //   Joi.object({
      //     env: Joi.string().lowercase().required(),
      //     value: workspaceAttrs.url.required(),
      //   }).required(),
      // ).required(),
    }).required(), params);

    await this.throwIfSlugHasRedirect({ slug, appId: app._id, orgId: org._id });

    const now = new Date();
    const doc = cleanDocument({
      app,
      org,
      slug,
      name,
      // urls,
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
      const commonRel = { _id: workspace._id, name: workspace.name, slug: workspace.slug };

      await Promise.all([
        this.manager.$('application').pushRelatedWorkspace({
          appId: app._id,
          workspace: { ...commonRel, org: workspace.org },
          options,
        }),
        this.manager.$('organization').updateOne({
          query: { _id: org._id, 'workspaces._id': { $ne: workspace._id } },
          update: {
            $push: { workspaces: cleanDocument({ ...commonRel, app: workspace.app }) },
          },
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
      id: workspaceAttrs.id,
      slug: workspaceAttrs.slug.required(),
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
   * @param {string} params.name
   */
  async updateName(params = {}) {
    const {
      id,
      name,
    } = await validateAsync(Joi.object({
      id: workspaceAttrs.id.required(),
      name: workspaceAttrs.name.required(),
    }).required(), params);

    const update = await buildUpdateNamePipeline({ name });
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the workspace.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      // then update relationships.
      await Promise.all([
        // user memberships
        this.manager.$('user').updateMany({
          query: { 'memberships.workspace._id': id },
          update: { $set: { 'memberships.$[elem].workspace.name': name } },
          options: {
            arrayFilters: [{ 'elem.workspace._id': id }],
            session,
          },
        }),
        // app workspaces
        this.manager.$('application').updatedRelatedWorkspaces({ id, name, options: { session } }),
        // org workspaces
        this.manager.$('organization').updateMany({
          query: { 'workspaces._id': id },
          update: { $set: { 'workspaces.$[elem].name': name } },
          options: {
            arrayFilters: [{ 'elem._id': id }],
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
   *
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   * @param {string} [params.slug]
   * @param {object} [params.options={}]
   */
  async updateRelatedAppFields(params = {}) {
    const {
      id,
      name,
      slug,
      options,
    } = await validateAsync(Joi.object({
      id: appAttrs.id.required(),
      name: appAttrs.name,
      slug: appAttrs.slug,
      options: Joi.object().default({}),
    }).required(), params);

    if ([name, slug].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'app._id': id },
      update: {
        $set: {
          ...(name && { 'app.name': name }),
          ...(slug && { 'app.slug': slug }),
        },
      },
      options,
    });
  }

  /**
   *
   * @param {object} params
   * @param {object} params.user
   * @param {ObjectId} params.user.id
   * @param {string} [params.user.email]
   * @param {string} [params.user.givenName]
   * @param {string} [params.user.familyName]
   * @param {object} [params.options={}]
   */
  async updateRelatedMembersFields(params = {}) {
    const {
      user,
      options,
    } = await validateAsync(Joi.object({
      user: Joi.object({
        id: userAttrs.id.required(),
        email: userAttrs.email,
        givenName: userAttrs.givenName,
        familyName: userAttrs.familyName,
      }).required(),
      options: Joi.object().default({}),
    }).required(), params);

    if ([user.email, user.givenName, user.familyName].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'members.user._id': user.id },
      update: {
        $set: {
          ...(user.email && { 'members.$[elem].user.email': user.email }),
          ...(user.givenName && { 'members.$[elem].user.givenName': user.givenName }),
          ...(user.familyName && { 'members.$[elem].user.familyName': user.familyName }),
        },
      },
      options: {
        ...options,
        arrayFilters: [{ 'elem.user._id': user.id }],
      },
    });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   * @param {string} [params.slug]
   * @param {object} [params.options={}]
   */
  async updateRelatedOrgFields(params = {}) {
    const {
      id,
      name,
      slug,
      options,
    } = await validateAsync(Joi.object({
      id: orgAttrs.id.required(),
      name: orgAttrs.name,
      slug: orgAttrs.slug,
      options: Joi.object().default({}),
    }).required(), params);

    if ([name, slug].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'org._id': id },
      update: {
        $set: {
          ...(name && { 'org.name': name }),
          ...(slug && { 'org.slug': slug }),
        },
      },
      options,
    });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} params.slug
   * @param {ObjectId} params.appId
   * @param {ObjectId} params.orgId
   */
  async updateSlug(params = {}) {
    const {
      id,
      slug,
      appId,
      orgId,
    } = await validateAsync(Joi.object({
      id: workspaceAttrs.id,
      slug: workspaceAttrs.slug.required(),
      appId: appAttrs.id.required(),
      orgId: orgAttrs.id.required(),
    }).required(), params);

    const update = await this.manager.prepareSlugUpdatePipeline({
      repo: 'workspace',
      id,
      slug,
      query: { 'app._id': appId, 'org._id': orgId },
    });
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the workspace.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      // then update relationships.
      await Promise.all([
        // user memberships
        this.manager.$('user').updateMany({
          query: { 'memberships.workspace._id': id },
          update: { $set: { 'memberships.$[elem].workspace.slug': slug } },
          options: {
            arrayFilters: [{ 'elem.workspace._id': id }],
            session,
          },
        }),
        // app workspaces
        this.manager.$('application').updatedRelatedWorkspaces({ id, slug, options: { session } }),
        // org workspaces
        this.manager.$('organization').updateMany({
          query: { 'workspaces._id': id },
          update: { $set: { 'workspaces.$[elem].slug': slug } },
          options: {
            arrayFilters: [{ 'elem._id': id }],
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
}
