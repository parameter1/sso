import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as appAttrs,
  organizationAttributes as orgAttrs,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';

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
   *
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      app,
      org,
      slug,
      name,
      // urls,
      options,
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
      // options: Joi.object().default({}),
    }).required(), params);

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
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
      }, { preserveEmptyArrays: true }),
      options,
    });
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
      id: workspaceAttrs.id.required(),
      name: workspaceAttrs.name.required(),
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
          query: { 'memberships.workspace._id': id },
          update: { $set: { 'memberships.$[elem].workspace.name': name } },
          options: {
            arrayFilters: [{ 'elem.workspace._id': id }],
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
