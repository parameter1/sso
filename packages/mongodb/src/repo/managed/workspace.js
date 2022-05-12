import { PropTypes, validateAsync } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import AbstractManagementRepo from './-abstract.js';
import { contextSchema, workspaceProps, workspaceSchema } from '../../schema/index.js';
import { buildMaterializedWorkspacePipeline } from '../materializer.js';

const { object } = PropTypes;

export default class WorkspaceRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'workspaces',
      collatableFields: [],
      indexes: [
        { key: { 'organization._id': 1, 'application._id': 1, key: 1 }, unique: true },
        { key: { slug: 1 } },
        { key: { 'application._id': 1 } },
      ],
      schema: workspaceSchema,
      materializedPipelineBuilder: buildMaterializedWorkspacePipeline,
      onMaterialize: async ({ materializedIds }) => {
        const update = new Map();
        update.set('user', { 'workspaces._id': { $in: materializedIds } });
        return update;
      },
    });
  }

  /**
   * Changes the name for the provided workspace ID.
   *
   * @param {object} params
   * @param {ObjectId|string} params.id
   * @param {string} params.name
   * @param {object} [params.session]
   * @param {object} [params.context]
   * @returns {Promise<BulkWriteResult>}
   */
  async updateName(params) {
    const {
      id,
      name,
      session,
      context,
    } = await validateAsync(object({
      id: workspaceProps.id.required(),
      name: workspaceProps.name.required(),
      session: object(),
      context: contextSchema,
    }).required(), params);

    return this.update({
      filter: { _id: id, name: { $ne: name } },
      materializeFilter: { _id: id },
      many: false,
      update: [{ $set: { name, slug: sluggify(name) } }],
      session,
      context,
    });
  }
}
