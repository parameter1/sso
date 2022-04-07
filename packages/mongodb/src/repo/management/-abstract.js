import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync, attempt } from '@sso/prop-types';

import cleanDocument from '../../utils/clean-document.js';
import { contextSchema, contextProps } from '../../schema/index.js';

const {
  array,
  object,
  propTypeObject,
} = PropTypes;

const versionDoc = ({ n, source, context }) => ({
  n,
  date: '$$NOW',
  source,
  user: context.userId ? { _id: context.userId } : null,
  ip: context.ip,
  ua: context.ua,
});

const versionOnCreate = ({ source, context }) => {
  const version = versionDoc({ n: 1, source, context });
  return {
    first: version,
    current: version,
    history: [version],
  };
};

export default class AbstractManagementRepo extends ManagedRepo {
  constructor(params) {
    const {
      schema,
      options,
      source,
      ...rest
    } = attempt(params, object({
      schema: object({
        create: propTypeObject().required(),
      }),
      source: contextProps.source.required(),
    }).required().unknown());

    const indexes = [
      // global
      { key: { '_version.first.date': 1, _id: 1 } },
      { key: { '_version.current.date': 1, _id: 1 } },
      // repo specific
      ...(Array.isArray(rest.indexes) ? rest.indexes : []),
    ];

    super({ ...rest, indexes });
    this.schema = schema;
    this.source = source;
    this.options = options;
  }

  /**
   * Creates multiple documents.
   *
   * @param {object} params
   * @param {object[]} params.docs
   * @param {object} [params.session]
   *
   * @param {object} params.context
   * @param {object} [params.context.userId]
   * @param {string} [params.context.ip]
   * @param {string} [params.context.ua]
   */
  async batchCreate(params) {
    const { docs, session, context } = await validateAsync(object({
      docs: array().items(this.schema.create).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const filter = { _id: { $lt: 0 } };
    const operations = docs.map((doc) => {
      const obj = { ...doc, _version: versionOnCreate({ source: this.source, context }) };
      const update = [{ $replaceRoot: { newRoot: { $mergeObjects: [cleanDocument(obj), '$$ROOT'] } } }];
      return { updateOne: { filter, update, upsert: true } };
    });
    const { result } = await this.bulkWrite({ operations, options: { session } });
    return result.upserted;
  }

  /**
   * Creates multiple documents and returns a cursor of the documents from the
   * database.
   *
   * @param {object} params
   * @param {object[]} params.docs
   * @param {object} [params.projection]
   * @param {object} [params.session]
   */
  async batchCreateAndReturn(params) {
    const { projection, session } = await validateAsync(object({
      docs: array().items(this.schema.create).required(),
      projection: object(),
      session: object(),
    }).required(), params);
    const results = await this.batchCreate({ docs: params.docs, session });
    const ids = await results.map(({ _id }) => _id);
    return this.find({
      query: { _id: { $in: ids } },
      options: { projection, session },
    });
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

  /**
   * Creates a single document and returns it from the database.
   *
   * @param {object} params
   * @param {object} params.doc
   * @param {object} [params.projection]
   * @param {object} [params.session]
   */
  async createAndReturn(params) {
    const { projection, session } = await validateAsync(object({
      doc: this.schema.create,
      projection: object(),
      session: object(),
    }).required(), params);
    const { _id } = await this.create({ doc: params.doc, session });
    return this.findByObjectId({ id: _id, options: { projection, session } });
  }
}
