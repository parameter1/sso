import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@sso/prop-types';

import { applicationProps } from '../../schema/index.js';
import { buildInsertCriteria, buildInsertPipeline, buildUpdatePipeline } from '../../pipelines/index.js';

const { object } = PropTypes;

export default class ApplicationRepo extends ManagedRepo {
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
   * Creates a new application
   *
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.key
   * @param {string[]} [params.roles=[Administrator, Member]]
   * @param {object} [params.session]
   */
  async create(params = {}) {
    const {
      name,
      key,
      roles,
      session,
    } = await validateAsync(object({
      name: applicationProps.name.required(),
      key: applicationProps.key.required(),
      roles: applicationProps.roles.default(['Administrator', 'Member']),
      session: object(),
    }).required(), params);

    return this.updateOne({
      query: buildInsertCriteria(),
      update: buildInsertPipeline({ name, key, roles }),
      options: { session, upsert: true },
    });
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