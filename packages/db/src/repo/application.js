import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import { applicationAttributes as attrs } from '../schema/attributes/index.js';

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
   * @param {ObjectId} [params.id]
   * @param {string} [params.slug]
   */
  throwIfSlugHasRedirect({ id, slug } = {}) {
    return this.manager.throwIfSlugHasRedirect({ repo: 'application', id, slug });
  }

  /**
   * @param {object} params
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

    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the org.
      const result = await this.updateOne({
        query: { _id: id },
        update: { $set: { name, 'date.updated': new Date() } },
        options: { strict: true, session },
      });

      // then update relationships.
      await Promise.all([
        // user memberships
        this.manager.$('user').updateMany({
          query: { 'memberships.workspace.app._id': id },
          update: { $set: { 'memberships.$[elem].workspace.app.name': name } },
          options: {
            arrayFilters: [{ 'elem.workspace.app._id': id }],
            session,
          },
        }),
        // workspaces
        this.manager.$('workspace').updateMany({
          query: { 'app._id': id },
          update: { $set: { 'app.name': name } },
          options: {
            session,
          },
        }),
        // org workspaces
        this.manager.$('organization').updateMany({
          query: { 'workspaces.app._id': id },
          update: { $set: { 'workspaces.$[elem].app.name': name } },
          options: {
            arrayFilters: [{ 'elem.app._id': id }],
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
      // attempt to update the org.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // then update relationships.
      await Promise.all([
        // user memberships
        this.manager.$('user').updateMany({
          query: { 'memberships.workspace.app._id': id },
          update: { $set: { 'memberships.$[elem].workspace.app.slug': slug } },
          options: {
            arrayFilters: [{ 'elem.workspace.app._id': id }],
            session,
          },
        }),
        // workspaces
        this.manager.$('workspace').updateMany({
          query: { 'app._id': id },
          update: { $set: { 'app.slug': slug } },
          options: {
            session,
          },
        }),
        // org workspaces
        this.manager.$('organization').updateMany({
          query: { 'workspaces.app._id': id },
          update: { $set: { 'workspaces.$[elem].app.slug': slug } },
          options: {
            arrayFilters: [{ 'elem.app._id': id }],
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
