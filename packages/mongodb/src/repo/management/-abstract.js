import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync, attempt } from '@sso/prop-types';

import { contextSchema, contextProps } from '../../schema/index.js';
import {
  buildDeletePipeline,
  buildInsertCriteria,
  buildInsertPipeline,
  buildUpdatePipeline,
} from '../../pipelines/index.js';

const {
  array,
  boolean,
  object,
  objectId,
  propTypeObject,
} = PropTypes;

export default class AbstractManagementRepo extends ManagedRepo {
  constructor(params) {
    const {
      onPropUpdate,
      schema,
      options,
      source,
      isVersioned,
      ...rest
    } = attempt(params, object({
      onPropUpdate: object().unknown().default(),
      schema: object({
        create: propTypeObject().required(),
        updateProps: propTypeObject(),
      }),
      source: contextProps.source.required(),
      isVersioned: boolean().default(true),
    }).required().unknown());

    const DELETED_PATH = '_version.current.deleted';
    const indexes = isVersioned ? [
      // optional "version locking"
      { key: { _id: 1, '_version.current.n': 1 } },

      { key: { '_version.initial.date': 1, _id: 1 } }, // allows "created date" sort
      { key: { '_version.current.date': 1, _id: 1 } }, // allows "updated date" sort

      // allows for deleting documents while still retaining change stream history
      {
        key: { '_version.current.date': 1 },
        expireAfterSeconds: 0,
        partialFilterExpression: { [DELETED_PATH]: true },
      },

      // repo specific
      ...(Array.isArray(rest.indexes) ? rest.indexes.map((index) => {
        // and ensure all indexes exclude pending deleted items
        // since the `DELETED_PATH` is added as global find criteria, this will ensure
        // that indexes are still used when present in a query
        const partialFilterExpression = { [DELETED_PATH]: false };
        return {
          ...index,
          partialFilterExpression: { ...index.partialFilterExpression, partialFilterExpression },
        };
      }) : []),
    ] : rest.indexes;

    super({
      ...rest,
      indexes,
      // because the TTL index can hold documents for up to 60 seconds, exclude them when querying
      globalFindCriteria: isVersioned ? { [DELETED_PATH]: false } : undefined,
    });
    this.onPropUpdate = onPropUpdate;
    this.schema = schema;
    this.source = source;
    this.options = options;
    this.isVersioned = isVersioned;
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

    const filter = buildInsertCriteria();
    const operations = docs.map((doc) => {
      const update = buildInsertPipeline(doc, {
        isVersioned: this.isVersioned,
        source: this.source,
        context,
      });
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
    const { projection, session, context } = await validateAsync(object({
      docs: array().items(this.schema.create).required(),
      projection: object(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    const results = await this.batchCreate({ docs: params.docs, session, context });
    const ids = await results.map(({ _id }) => _id);
    return this.find({
      query: { _id: { $in: ids } },
      options: { projection, session },
    });
  }

  /**
   * Deletes multiple documents.
   *
   * @param {object} params
   * @param {string[]} params.ids
   * @param {object} [params.session]
   * @param {object} [params.context]
   */
  async batchDelete(params) {
    const { ids, session, context } = await validateAsync(object({
      ids: array().items(objectId().required()).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const query = { _id: { $in: ids } };

    if (!this.isVersioned) return this.deleteMany({ query, options: { session } });

    const update = buildDeletePipeline({ source: this.source, context });
    return this.updateMany({ query, update, options: { session } });
  }

  /**
   * Creates a single document.
   *
   * @param {object} params
   * @param {object} params.doc
   * @param {object} [params.session]
   */
  async create(params) {
    const { session, context } = await validateAsync(object({
      doc: this.schema.create,
      session: object(),
      context: contextSchema,
    }).required(), params);
    const [r] = await this.batchCreate({ docs: [params.doc], session, context });
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
    const { projection, session, context } = await validateAsync(object({
      doc: this.schema.create,
      projection: object(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    const { _id } = await this.create({ doc: params.doc, session, context });
    return this.findByObjectId({ id: _id, options: { projection, session } });
  }

  /**
   * Deletes a single document.
   *
   * @param {object} params
   * @param {string} params.id
   * @param {object} [params.session]
   * @param {object} [params.context]
   */
  async delete(params) {
    const { id, session, context } = await validateAsync(object({
      id: objectId().required(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    return this.batchDelete({ ids: [id], session, context });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {object} [params.props]
   * @param {object} [params.session]
   * @param {object} [params.context]
   */
  async updateProps(params) {
    if (!this.schema.updateProps) {
      throw new Error('No update props schema has been defined for this repo.');
    }
    const {
      id,
      props,
      session,
      context,
    } = await validateAsync(object({
      id: objectId().required(),
      props: this.schema.updateProps,
      session: object(),
      context: contextSchema,
    }).required(), params);

    const fields = [];
    Object.keys(props).forEach((path) => {
      const value = props[path];
      const defaultHandler = () => (value ? { path, value } : null);
      const propHandler = this.onPropUpdate[path];
      const handler = typeof propHandler === 'function' ? propHandler : defaultHandler;

      const resolved = handler({ props, value });
      if (resolved) fields.push(resolved);
    });
    if (!fields.length) return null; // noop
    return this.updateOne({
      query: { _id: id },
      update: buildUpdatePipeline(fields, {
        isVersioned: this.isVersioned,
        source: this.source,
        context,
      }),
      options: { session, strict: true },
    });
  }
}