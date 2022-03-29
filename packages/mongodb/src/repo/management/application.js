import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@sso/prop-types';

import { applicationProps, createApplicationSchema } from '../../schema/index.js';
import { buildInsertCriteria, buildInsertPipeline, buildUpdatePipeline } from '../../pipelines/index.js';

const { array, object } = PropTypes;

export default class ApplicationRepo extends ManagedRepo {
  /**
   *
   * @typedef CreateApplicationSchema
   * @property {string} name
   * @property {string} key
   * @property {string[]} [roles=[Administrator, Member]]
   */

  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'applications',
      collatableFields: [],
      indexes: [
        { key: { key: 1 }, unique: true },

        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }

  /**
   * Creates a multiple applications
   *
   * @param {object} params
   * @param {CreateApplicationSchema[]} params.docs
   * @param {object} [params.session]
   */
  async batchCreate(params) {
    const {
      docs,
      session,
    } = await validateAsync(object({
      docs: array().items(createApplicationSchema).required(),
      session: object(),
    }).required(), params);

    const operations = docs.map((doc) => {
      const filter = buildInsertCriteria();
      const update = buildInsertPipeline(doc);
      return { updateOne: { filter, update, upsert: true } };
    });
    const { result } = await this.bulkWrite({ operations, options: { session } });
    return result.upserted;
  }

  /**
   * Creates a new application
   *
   * @param {object} params
   * @param {CreateApplicationSchema} params.doc
   * @param {object} [params.session]
   */
  async create(params) {
    const { doc, session } = await validateAsync(object({
      doc: createApplicationSchema,
      session: object(),
    }).required(), params);
    const [r] = await this.batchCreate({ docs: [doc], session });
    return r;
  }

  /**
   * Finds an application by key.
   *
   * @param {object} params
   * @param {string} params.key
   * @param {object} [params.options]
   */
  findByKey({ key, options } = {}) {
    return this.findOne({ query: { key }, options });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   */
  async updateProps(params = {}) {
    const { id, name } = await validateAsync(object({
      id: applicationProps.id.required(),
      name: applicationProps.name,
    }).required(), params);

    const fields = [];
    if (name) fields.push({ path: 'name', value: name });
    if (!fields.length) return null; // noop
    return this.updateOne({
      query: { _id: id },
      update: buildUpdatePipeline(fields),
      options: { strict: true },
    });
  }
}
