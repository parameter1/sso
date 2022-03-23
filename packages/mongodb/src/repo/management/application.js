import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@sso/prop-types';

import cleanDocument from '../../utils/clean-document.js';
import { applicationProps } from '../../schema/index.js';
import { buildUpdatePipeline } from '../../pipelines/index.js';

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
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      name,
      key,
      roles,
      options,
    } = await validateAsync(object({
      name: applicationProps.name.required(),
      key: applicationProps.key.required(),
      roles: applicationProps.roles.default(['Administrator', 'Member']),
      options: object().default({}),
    }).required(), params);

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        name,
        key,
        date: { created: now, updated: now },
        roles,
      }),
      options,
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
