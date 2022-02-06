import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as attrs,
  organizationAttributes as orgAttrs,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';
import DenormalizationManager from '../dnz-manager/index.js';

import { buildUpdatePipeline, slugRedirects } from './pipelines/index.js';

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

    this.dnzManager = new DenormalizationManager({
      repoManager: this.manager,
      globalFields: [
        // @todo vet schema and required prop usage
        { name: 'name', schema: attrs.name, required: true },
        { name: 'slug', schema: attrs.slug, required: true },
      ],
      // @todo automatically update `date.updated`??
      definitions: [
        ['user::memberships', { subPath: 'workspace.app', isArray: true }],
        ['organization::workspaces', { subPath: 'app', isArray: true }],
        ['workspace::app', { subPath: null, isArray: false }],
      ],
    });
  }

  /**
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.slug
   * @param {string[]} [params.roles=[Administrator, Member]]
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      name,
      slug,
      roles,
      options,
    } = await validateAsync(Joi.object({
      name: attrs.name.required(),
      slug: attrs.slug.required(),
      roles: Joi.array().items(Joi.string().required()).default(['Administrator', 'Member']),
      options: Joi.object().default({}),
    }).required(), params);

    await this.throwIfSlugHasRedirect({ slug });

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        name,
        slug,
        date: { created: now, updated: now },
        roles,
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

    const update = buildUpdatePipeline([
      { path: 'name', value: name },
    ]);
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

      const { dnzManager } = this;
      await dnzManager.executeRepoBulkOps({
        repoBulkOps: dnzManager.buildRepoBulkOpsFor({ id, values: { name } }),
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

    await this.throwIfSlugHasRedirect({ id, slug });
    const update = buildUpdatePipeline([
      { path: 'slug', value: slug, set: () => slugRedirects(slug) },
    ]);

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

      const { dnzManager } = this;
      await dnzManager.executeRepoBulkOps({
        repoBulkOps: dnzManager.buildRepoBulkOpsFor({ id, values: { slug } }),
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
