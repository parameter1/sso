import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as appAttrs,
  organizationAttributes as orgAttrs,
} from '../schema/attributes/index.js';

export default class InstanceRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'instances',
      collatableFields: [],
      indexes: [
        { key: { 'org._id': 1, 'app._id': 1 }, unique: true },
        { key: { 'app._id': 1 } },

        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }

  /**
   * @param {object} params
   * @param {object} params.app
   * @param {string|ObjectId} params.app._id
   * @param {string} params.app.slug
   * @param {string} params.app.name
   *
   * @param {object} params.org
   * @param {string|ObjectId} params.org._id
   * @param {string} params.org.slug
   * @param {string} params.org.name
   *
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      app,
      org,
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
    }).required(), params);

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        app: { node: app },
        org: { node: org },
        name: `${app.name} > ${org.name}`,
        namespace: `${app.slug}.${org.slug}`,
        date: { created: now, updated: now },
      }),
      options,
    });
  }

  /**
   * Finds an application instance by namespace.
   *
   * @param {object} params
   * @param {string} params.namespace
   * @param {object} [params.options]
   */
  findByNamespace({ namespace, options } = {}) {
    return this.findOne({ query: { namespace }, options });
  }
}
