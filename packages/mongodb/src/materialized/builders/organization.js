import { BaseBuilder } from './-base.js';
import { fullOrganization, partialUser } from './-projections.js';

export class OrganizationBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'organization' });
  }

  static buildPipelineStages() {
    const stages = [];
    stages.push({
      $lookup: {
        from: 'manager/normalized',
        localField: '_id',
        foreignField: '_id.org',
        as: '_connection.manager.edges',
        pipeline: [
          // do not include deleted managers
          { $match: { $expr: { $eq: ['$_deleted', false] } } },
          // drop history
          { $project: { _history: 0 } },
          // lookup the user
          {
            $lookup: {
              from: 'user/normalized',
              localField: '_id.user',
              foreignField: '_id',
              as: 'node',
              pipeline: [
                // do not include deleted users
                { $match: { $expr: { $eq: ['$_deleted', false] } } },
                { $project: partialUser() },
              ],
            },
          },
          // flatten the user into a single object
          // and discard when no active user is found (i.e. do not preserve)
          { $unwind: { path: '$node', preserveNullAndEmptyArrays: false } },
        ],
      },
    }, {
      $set: {
        '_connection.manager.edges': {
          $map: {
            // filter any missing/empty user nodes
            input: { $filter: { input: '$_connection.manager.edges', cond: '$$this.node' } },
            in: ['_meta', 'node', 'role'].reduce((o, key) => ({ ...o, [key]: `$$this.${key}` }), {}),
          },
        },
      },
    });
    stages.push({ $project: fullOrganization() });
    return stages;
  }
}
