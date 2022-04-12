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
      usesSoftDelete,
      ...rest
    } = attempt(params, object({
      onPropUpdate: object().unknown().default(),
      schema: object({
        create: propTypeObject().required(),
        updateProps: propTypeObject(),
      }),
      source: contextProps.source.required(),
      isVersioned: boolean().default(true),
      usesSoftDelete: boolean().default(true),
    }).required().unknown());

    const DELETED_PATH = '_deleted';

    const indexes = isVersioned ? [
      // optional "version locking"
      { key: { _id: 1, '_version.current.n': 1 } },

      { key: { '_version.initial.date': 1, _id: 1 } }, // allows "created date" sort
      { key: { '_version.current.date': 1, _id: 1 } }, // allows "updated date" sort
      ...(rest.indexes || []),
    ] : rest.indexes;

    super({
      ...rest,
      // ensure all indexes exclude soft-deleted items
      // since the `DELETED_PATH` is added as global find criteria, this will ensure
      // that indexes are still preserved when querying.
      indexes: usesSoftDelete ? (indexes || []).map((index) => ({
        ...index,
        partialFilterExpression: {
          ...index.partialFilterExpression,
          [DELETED_PATH]: false,
        },
      })) : indexes,
      // ensure soft-deleted documents are excluded from all queries.
      globalFindCriteria: usesSoftDelete ? { [DELETED_PATH]: false } : undefined,
    });
    this.onPropUpdate = onPropUpdate;
    this.schema = schema;
    this.source = source;
    this.options = options;
    this.isVersioned = isVersioned;
    this.usesSoftDelete = usesSoftDelete;
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
        usesSoftDelete: this.usesSoftDelete,
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
   * Performs multiple delete one or many operations
   *
   * @param {object} params
   * @param {object[]} params.ops
   * @param {object} params.ops.filter
   * @param {boolean} params.ops.many
   * @param {object} [params.session]
   * @param {object} [params.context]
   */
  async bulkDelete(params) {
    const { ops, session, context } = await validateAsync(object({
      ops: array().items(object({
        filter: object().unknown().required(),
        many: boolean().required(),
      }).required()).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const operations = ops.map((op) => {
      const prefix = this.usesSoftDelete ? 'update' : 'delete';
      const suffix = op.many ? 'Many' : 'One';
      const name = `${prefix}${suffix}`;

      const operation = { filter: op.filter };
      if (this.usesSoftDelete) {
        operation.update = buildDeletePipeline({
          isVersioned: this.isVersioned,
          source: this.source,
          context,
        });
      }

      return { [name]: operation };
    });
    return this.bulkWrite({ operations, options: { session } });
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
   * Deletes one or more documents based on the provided filter.
   *
   * @param {object} params
   * @param {object} params.filter
   * @param {boolean} [params.many=false]
   * @param {object} [params.session]
   * @param {object} [params.context]
   */
  async delete(params) {
    const {
      filter,
      many,
      session,
      context,
    } = await validateAsync(object({
      filter: object().unknown().required(),
      many: boolean().default(false),
      session: object(),
      context: contextSchema,
    }).required(), params);
    return this.bulkDelete({ ops: [{ filter, many }], session, context });
  }

  /**
   * Deletes a single document for the provided ID.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {object} params.session
   * @param {object} params.context
   * @returns {Promise<object>}
   */
  async deleteForId(params) {
    const { id, session, context } = await validateAsync(object({
      id: objectId().required(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    return this.delete({
      filter: { _id: id },
      many: false,
      session,
      context,
    });
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
