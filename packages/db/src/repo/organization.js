import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import { organizationAttributes as attrs } from '../schema/attributes/index.js';

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
   * @param {ObjectId} [params.id]
   * @param {string} [params.slug]
   */
  throwIfSlugHasRedirect({ id, slug } = {}) {
    return this.manager.throwIfSlugHasRedirect({ repo: 'organization', id, slug });
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
      await Promise.all([
        // user managers
        this.manager.$('user').updateMany({
          query: { 'manages.org._id': id },
          update: { $set: { 'manages.$[elem].org.name': name } },
          options: {
            arrayFilters: [{ 'elem.org._id': id }],
            session,
          },
        }),
        // user memberships
        this.manager.$('user').updateMany({
          query: { 'memberships.workspace.org._id': id },
          update: { $set: { 'memberships.$[elem].workspace.org.name': name } },
          options: {
            arrayFilters: [{ 'elem.workspace.org._id': id }],
            session,
          },
        }),
        // workspaces
        this.manager.$('workspace').updateRelatedOrgFields({ id, name, options: { session } }),
        // app workspaces
        this.manager.$('application').updateMany({
          query: { 'workspaces.org._id': id },
          update: { $set: { 'workspaces.$[elem].org.name': name } },
          options: {
            arrayFilters: [{ 'elem.org._id': id }],
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
      await Promise.all([
        // user managers
        this.manager.$('user').updateMany({
          query: { 'manages.org._id': id },
          update: { $set: { 'manages.$[elem].org.slug': slug } },
          options: {
            arrayFilters: [{ 'elem.org._id': id }],
            session,
          },
        }),
        // user memberships
        this.manager.$('user').updateMany({
          query: { 'memberships.workspace.org._id': id },
          update: { $set: { 'memberships.$[elem].workspace.org.slug': slug } },
          options: {
            arrayFilters: [{ 'elem.workspace.org._id': id }],
            session,
          },
        }),
        // workspaces
        this.manager.$('workspace').updateRelatedOrgFields({ id, slug, options: { session } }),
        // app workspaces
        this.manager.$('application').updateMany({
          query: { 'workspaces.org._id': id },
          update: { $set: { 'workspaces.$[elem].org.slug': slug } },
          options: {
            arrayFilters: [{ 'elem.org._id': id }],
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
