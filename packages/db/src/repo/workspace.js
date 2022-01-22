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
   *
   * @param {object} params.org
   * @param {ObjectId} params.org._id
   * @param {string} params.org.slug
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
      }).required(),
      org: Joi.object({
        _id: orgAttrs.id.required(),
        slug: orgAttrs.slug.required(),
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
        namespace: `${app.slug}.${org.slug}`,
        slug,
        name,
        // urls,
        createdAt: now,
        updatedAt: now,
      }),
      options,
    });
  }
}
