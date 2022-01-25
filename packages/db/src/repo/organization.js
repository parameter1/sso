import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as appAttrs,
  organizationAttributes as attrs,
  userAttributes as userAttrs,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';

import { buildUpdateNamePipeline } from './pipelines/index.js';

export default class OrganizationRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'organizations',
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
        managers: [],
        workspaces: [],
        redirects: [],
      }, { preserveEmptyArrays: true }),
      options,
    });
  }

  /**
   * Finds an organization by slug.
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
      orgId,
      workspace,
      options,
    } = await validateAsync(Joi.object({
      orgId: attrs.id.required(),
      workspace: Joi.object({
        _id: workspaceAttrs.id.required(),
        slug: workspaceAttrs.slug.required(),
        name: workspaceAttrs.name.required(),
        app: Joi.object({
          _id: appAttrs.id.required(),
          slug: appAttrs.slug.required(),
          name: appAttrs.name.required(),
        }).required(),
      }).required(),
      options: Joi.object().default({}),
    }).required(), params);

    return this.updateOne({
      query: { _id: orgId, 'workspaces._id': { $ne: workspace._id } },
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
    return this.manager.throwIfSlugHasRedirect({ repo: 'organization', id, slug });
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
      // user managed orgs
      this.manager.$('user').updateRelatedManagedOrgs({ id, name, options }),
      // user memberships
      this.manager.$('user').updateRelatedMembershipWorkspaceOrgs({ id, name, options }),
      // workspaces
      this.manager.$('workspace').updateRelatedOrgs({ id, name, options }),
      // app workspace orgs
      this.manager.$('application').updateRelatedWorkspaceOrgs({ id, name, options }),
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
      // user managed orgs
      this.manager.$('user').updateRelatedManagedOrgs({ id, slug, options }),
      // user membership workspace orgs
      this.manager.$('user').updateRelatedMembershipWorkspaceOrgs({ id, slug, options }),
      // workspaces
      this.manager.$('workspace').updateRelatedOrgs({ id, slug, options }),
      // app workspace orgs
      this.manager.$('application').updateRelatedWorkspaceOrgs({ id, slug, options }),
    ]);
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
      id: attrs.id.required(),
      name: attrs.name.required(),
    }).required(), params);

    const update = await buildUpdateNamePipeline({ name });
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the org.
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
   * @param {object} params.user
   * @param {ObjectId} params.user._id
   * @param {string} [params.user.email]
   * @param {string} [params.user.givenName]
   * @param {string} [params.user.familyName]
   * @param {object} [params.options={}]
   */
  async updateRelatedManagers(params = {}) {
    const {
      user,
      options,
    } = await validateAsync(Joi.object({
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email,
        givenName: userAttrs.givenName,
        familyName: userAttrs.familyName,
      }).required(),
      options: Joi.object().default({}),
    }).required(), params);

    if ([user.email, user.givenName, user.familyName].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'managers.user._id': user._id },
      update: {
        $set: {
          ...(user.email && { 'managers.$[elem].user.email': user.email }),
          ...(user.givenName && { 'managers.$[elem].user.givenName': user.givenName }),
          ...(user.familyName && { 'managers.$[elem].user.familyName': user.familyName }),
        },
      },
      options: {
        ...options,
        arrayFilters: [{ 'elem.user._id': user._id }],
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
  async updateRelatedWorkspaceApps(params = {}) {
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
      query: { 'workspaces.app._id': id },
      update: {
        $set: {
          ...(name && { 'workspaces.$[elem].app.name': name }),
          ...(slug && { 'workspaces.$[elem].app.slug': slug }),
        },
      },
      options: {
        ...options,
        arrayFilters: [{ 'elem.app._id': id }],
      },
    });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} params.slug
   */
  async updateSlug(params = {}) {
    const {
      id,
      slug,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      slug: attrs.slug.required(),
    }).required(), params);

    const update = await this.manager.prepareSlugUpdatePipeline({ repo: 'organization', id, slug });
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the org.
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
