import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync, attempt } from '@sso/prop-types';

import { buildInsertCriteria, buildInsertPipeline } from '../../pipelines/index.js';

const {
  array,
  object,
  propTypeObject,
  string,
} = PropTypes;

export default class AbstractManagementRepo extends ManagedRepo {
  constructor(params) {
    const { schema, options, ...rest } = attempt(params, object({
      schema: object({
        create: propTypeObject().required(),
      }),
      options: object({
        createDatePaths: array().items(string()).default(['date.created', 'date.updated']),
      }).default(),
    }).required().unknown());
    super(rest);
    this.schema = schema;
    this.options = options;
  }

  /**
   * Creates multiple documents.
   *
   * @param {object} params
   * @param {object[]} params.docs
   * @param {object} [params.session]
   */
  async batchCreate(params) {
    const { docs, session } = await validateAsync(object({
      docs: array().items(this.schema.create).required(),
      session: object(),
    }).required(), params);

    const operations = docs.map((doc) => {
      const filter = buildInsertCriteria();
      const update = buildInsertPipeline(doc, { datePaths: this.options.createDatePaths });
      return { updateOne: { filter, update, upsert: true } };
    });
    const { result } = await this.bulkWrite({ operations, options: { session } });
    return result.upserted;
  }

  /**
   * Creates a single document.
   *
   * @param {object} params
   * @param {object} params.doc
   * @param {object} [params.session]
   */
  async create(params) {
    const { session } = await validateAsync(object({
      doc: this.schema.create,
      session: object(),
    }).required(), params);
    const [r] = await this.batchCreate({ docs: [params.doc], session });
    return r;
  }
}
