import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync, attempt } from '@sso/prop-types';

import { contextSchema, contextProps } from '../../schema/index.js';
import { CleanDocument } from '../../utils/clean-document.js';
import Expr from '../../pipelines/utils/expr.js';

const DELETED_PATH = '_deleted';

const {
  any,
  array,
  boolean,
  object,
  objectId,
  propTypeObject,
  string,
} = PropTypes;

export default class AbstractManagementRepo extends ManagedRepo {
  constructor(params) {
    const {
      schema,
      source,
      isVersioned,
      usesSoftDelete,
      ...rest
    } = attempt(params, object({
      schema: object({
        create: propTypeObject().required(),
      }),
      source: contextProps.source.required(),
      isVersioned: boolean().default(true),
      usesSoftDelete: boolean().default(true),
    }).required().unknown());

    const indexes = isVersioned ? [
      { key: { '_touched.first.date': 1, _id: 1 } }, // allows a quasi "created date" sort
      { key: { '_touched.last.date': 1, _id: 1 } }, // allows a quasi "updated date" sort
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
    this.schema = schema;
    this.source = source;
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
  async bulkCreate(params) {
    const { docs, session, context } = await validateAsync(object({
      docs: array().items(this.schema.create).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const { result } = await this.bulkUpdate({
      ops: docs.map((doc) => ({
        filter: { _id: { $lt: 0 } },
        update: [
          {
            $replaceRoot: {
              newRoot: new Expr({
                $mergeObjects: [
                  CleanDocument.object({
                    ...doc,
                    ...(this.usesSoftDelete && { [DELETED_PATH]: false }),
                  }),
                  '$$ROOT',
                ],
              }),
            },
          },
        ],
        many: false,
        upsert: true,
      })),
      session,
      context,
    });
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
  async bulkCreateAndReturn(params) {
    const { projection, session, context } = await validateAsync(object({
      docs: array().items(this.schema.create).required(),
      projection: object(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    const results = await this.bulkCreate({ docs: params.docs, session, context });
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

    if (this.usesSoftDelete) {
      return this.bulkUpdate({
        ops: ops.map((op) => ({
          filter: op.filter,
          many: op.many,
          update: { [DELETED_PATH]: true },
        })),
        session,
        context,
      });
    }

    const operations = ops.map((op) => {
      const type = op.many ? 'deleteMany' : 'deleteOne';
      return { [type]: { filter: op.filter } };
    });
    return this.bulkWrite({ operations, options: { session } });
  }

  async bulkUpdate(params) {
    const { ops, session, context } = await validateAsync(object({
      ops: array().items(object({
        filter: object().unknown().required(),
        many: boolean().required(),
        update: array().items(object().unknown().required()),
        upsert: boolean().default(false),
      }).required()).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const touched = {
      date: '$$NOW',
      ip: context.ip,
      source: this.source,
      ua: context.ua,
      user: context.userId ? { _id: context.userId } : null,
    };

    const operations = ops.map((op) => {
      const type = op.many ? 'updateMany' : 'updateOne';
      const update = CleanDocument.value([
        ...op.update,
        ...(this.isVersioned ? [
          {
            $set: {
              '_touched.first': new Expr({
                $cond: {
                  if: { $eq: [{ $type: '$_touched.first' }, 'object'] },
                  then: '$_touched.first',
                  else: touched,
                },
              }),
              '_touched.last': touched,
              '_touched.n': new Expr({ $add: [{ $ifNull: ['$_touched.n', 0] }, 1] }),
            },
          },
        ] : []),
      ]);
      return {
        [type]: {
          filter: this.globalFindCriteria ? {
            $and: [op.filter, this.globalFindCriteria],
          } : op.filter,
          update,
          upsert: op.upsert,
          arrayFilters: op.arrayFilters,
        },
      };
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
    const [r] = await this.bulkCreate({ docs: [params.doc], session, context });
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
   * @returns {Promise<BulkWriteResult>}
   */
  async deleteForId(params) {
    const { id, session, context } = await validateAsync(object({
      id: objectId().required(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    return this.deleteForIds({ ids: [id], session, context });
  }

  /**
   * Deletes a multiple documents for the provided ID.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {object} params.session
   * @param {object} params.context
   * @returns {Promise<BulkWriteResult>}
   */
  async deleteForIds(params) {
    const { ids, session, context } = await validateAsync(object({
      ids: array().items(objectId().required()).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);
    return this.delete({
      filter: { _id: { $in: ids } },
      many: true,
      session,
      context,
    });
  }

  /**
   * Updates one or more documents based on the provided filter.
   *
   * @param {object} params
   * @param {object} params.filter
   * @param {boolean} [params.many=false]
   * @param {object|object[]} [params.update]
   * @param {boolean} [params.upsert=false]
   * @param {object} [params.session]
   * @param {object} [params.context]
   */
  async update(params) {
    const {
      filter,
      many,
      update,
      upsert,
      session,
      context,
    } = await validateAsync(object({
      filter: object().unknown().required(),
      many: boolean().default(false),
      update: array().items(object().unknown().required()),
      upsert: boolean().default(false),
      session: object(),
      context: contextSchema,
    }).required(), params);
    const op = {
      filter,
      many,
      update,
      upsert,
    };
    return this.bulkUpdate({ ops: [op], session, context });
  }

  /**
   * Generically updates one or more properties on the document with the provided ID.
   * Does not directly validate any values, but will skip undefined values.
   *
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {object} [params.props]
   * @param {object} [params.session]
   * @param {object} [params.context]
   */
  async updatePropsForId(params) {
    const {
      id,
      props,
      session,
      context,
    } = await validateAsync(object({
      id: objectId().required(),
      props: array().items(object({
        path: string().required(),
        value: any(),
      }).required()).required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    const filtered = props.filter(({ value }) => typeof value !== 'undefined');
    if (!filtered.length) return null; // noop

    return this.update({
      filter: { _id: id },
      update: [{
        $set: filtered.reduce((o, { path, value }) => ({ ...o, [path]: value }), {}),
      }],
      session,
      context,
    });
  }
}
