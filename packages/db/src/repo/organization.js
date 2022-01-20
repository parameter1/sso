import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import { organizationAttributes as attrs } from '../schema/attributes/index.js';

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

        { key: { name: 1, _id: 1 }, collation: { locale: 'en_US' } },
        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
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

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        name,
        slug,
        date: { created: now, updated: now },
      }),
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
}
