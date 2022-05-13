import { PropTypes, validateAsync } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import AbstractManagementRepo from './-abstract.js';
import { contextSchema, organizationProps, organizationSchema } from '../../schema/index.js';
import { buildMaterializedOrganizationPipeline } from '../materializer.js';

const { object } = PropTypes;

export default class OrganizationRepo extends AbstractManagementRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'organizations',
      collatableFields: [],
      indexes: [
        { key: { key: 1 }, unique: true },
        { key: { slug: 1 } },
      ],
      schema: organizationSchema,
      materializedPipelineBuilder: buildMaterializedOrganizationPipeline,
      onMaterialize: async ({ materializedIds }) => {
        const update = new Map();
        update.set('workspace', { '_edge.organization._id': { $in: materializedIds } });
        const workspaceIds = await this.manager.$('workspace').distinct({
          key: '_id',
          query: { '_edge.organization._id': { $in: materializedIds } },
          options: { useGlobalFindCriteria: false },
        });
        update.set('user', {
          $or: [
            { '_connection.workspace.edges._id': { $in: workspaceIds } },
            { '_connection.organization.edges._id': { $in: materializedIds } },
          ],
        });
        return update;
      },
    });
  }

  /**
   * Finds an organization by key.
   *
   * @param {object} params
   * @param {string} params.key
   * @param {object} [params.options]
   */
  findByKey({ key, options } = {}) {
    return this.findOne({ query: { key }, options });
  }

  /**
   * Changes the name for the provided organization ID.
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
      id: organizationProps.id.required(),
      name: organizationProps.name.required(),
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
