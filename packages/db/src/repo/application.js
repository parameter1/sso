import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as attrs,
  organizationAttributes as orgAttrs,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';

import { buildUpdateNamePipeline } from './pipelines/index.js';

export default class ApplicationRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'applications',
      collatableFields: ['name'],
      indexes: [
        { key: { slug: 1 }, unique: true, collation: { locale: 'en_US' } },
        { key: { redirects: 1 } },

        { key: { name: 1, _id: 1 }, collation: { locale: 'en_US' } },
      ],
    });
  }

  /**
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.slug
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      name,
      slug,
      options,
    } = await validateAsync(Joi.object({
      name: attrs.name.required(),
      slug: attrs.slug.required(),
      options: Joi.object().default({}),
    }).required(), params);

    await this.throwIfSlugHasRedirect({ slug });

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        name,
        slug,
        date: {
          created: now,
          updated: now,
        },
        workspaces: [],
        redirects: [],
      }, { preserveEmptyArrays: true }),
      options,
    });
  }

  /**
   * Finds an application by slug.
   *
   * @param {object} params
   * @param {string} params.slug
   * @param {object} [params.options]
   */
  findBySlug({ slug, options } = {}) {
    return this.findOne({ query: { slug }, options });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.appId
   * @param {object} params.workspace
   * @param {ObjectId} params.workspace._id
   * @param {string} params.workspace.name
   * @param {string} params.workspace.slug
   * @param {object} params.workspace.org
   * @param {object} [params.options={}]
   */
  async pushRelatedWorkspace(params = {}) {
    const {
      appId,
      workspace,
      options,
    } = await validateAsync(Joi.object({
      appId: attrs.id.required(),
      workspace: Joi.object({
        _id: workspaceAttrs.id.required(),
        slug: workspaceAttrs.slug.required(),
        name: workspaceAttrs.name.required(),
        org: Joi.object({
          _id: orgAttrs.id.required(),
          slug: orgAttrs.slug.required(),
          name: orgAttrs.name.required(),
        }).required(),
      }).required(),
      options: Joi.object().default({}),
    }).required(), params);

    return this.updateOne({
      query: { _id: appId, 'workspaces._id': { $ne: workspace._id } },
      update: { $addToSet: { workspaces: cleanDocument(workspace) } },
      options,
    });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} [params.id]
   * @param {string} [params.slug]
   */
  throwIfSlugHasRedirect({ id, slug } = {}) {
    return this.manager.throwIfSlugHasRedirect({ repo: 'application', id, slug });
  }

  async updateForeignNameValues(params = {}) {
    const {
      id,
      name,
      options,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      name: attrs.name.required(),
      options: Joi.object().default({}),
    }).required(), params);

    return Promise.all([
      // user memberships
      this.manager.$('user').updateRelatedMembershipWorkspaceApps({ id, name, options }),
      // workspaces
      this.manager.$('workspace').updateRelatedApps({ id, name, options }),
      // org workspaces
      this.manager.$('organization').updateRelatedWorkspaceApps({ id, name, options }),
    ]);
  }

  async updateForiegnSlugValues(params = {}) {
    const {
      id,
      slug,
      options,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      slug: attrs.slug.required(),
      options: Joi.object().default({}),
    }).required(), params);

    return Promise.all([
      // user memberships
      this.manager.$('user').updateRelatedMembershipWorkspaceApps({ id, slug, options }),
      // workspaces
      this.manager.$('workspace').updateRelatedApps({ id, slug, options }),
      // org workspaces
      this.manager.$('organization').updateRelatedWorkspaceApps({ id, slug, options }),
    ]);
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} params.name
   * @param {object} [params.options]
   */
  async updateName(params = {}) {
    const {
      id,
      name,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      name: attrs.name.required(),
    }).required(), params);

    const update = await buildUpdateNamePipeline({ name });
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the app.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      // then update relationships.
      await this.updateForeignNameValues({ id, name, options: { session } });

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
  async updateRelatedWorkspaces(params = {}) {
    const {
      id,
      name,
      slug,
      options,
    } = await validateAsync(Joi.object({
      id: workspaceAttrs.id.required(),
      name: workspaceAttrs.name,
      slug: workspaceAttrs.slug,
      options: Joi.object().default({}),
    }).required(), params);

    if ([name, slug].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'workspaces._id': id },
      update: {
        $set: {
          ...(name && { 'workspaces.$[elem].name': name }),
          ...(slug && { 'workspaces.$[elem].slug': slug }),
        },
      },
      options: {
        ...options,
        arrayFilters: [{ 'elem._id': id }],
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
  async updateRelatedWorkspaceOrgs(params = {}) {
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
      query: { 'workspaces.org._id': id },
      update: {
        $set: {
          ...(name && { 'workspaces.$[elem].org.name': name }),
          ...(slug && { 'workspaces.$[elem].org.slug': slug }),
        },
      },
      options: {
        ...options,
        arrayFilters: [{ 'elem.org._id': id }],
      },
    });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} params.slug
   * @param {object} [params.options]
   */
  async updateSlug(params = {}) {
    const {
      id,
      slug,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      slug: attrs.slug.required(),
    }).required(), params);

    const update = await this.manager.prepareSlugUpdatePipeline({ repo: 'application', id, slug });

    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the app.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      // then update relationships.
      await this.updateForiegnSlugValues({ id, slug, options: { session } });

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
