import { BaseBuilder } from './-base.js';
import { fullUser, partialOrganization } from './-projections.js';

export class UserBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'user' });
  }

  static buildPipelineStages() {
    const stages = [];
    stages.push({
      $lookup: {
        from: 'manager/normalized',
        localField: '_id',
        foreignField: '_id.user',
        as: 'organizationConnection.edges',
        pipeline: [
          // do not include deleted managers
          { $match: { $expr: { $eq: ['$_deleted', false] } } },
          // drop history
          { $project: { _history: 0 } },
          // lookup the organization
          {
            $lookup: {
              from: 'organization/normalized',
              localField: '_id.org',
              foreignField: '_id',
              as: 'node',
              pipeline: [
                // do not include deleted orgs
                { $match: { $expr: { $eq: ['$_deleted', false] } } },
                { $project: partialOrganization() },
              ],
            },
          },
          // flatten the org into a single object
          { $unwind: { path: '$node', preserveNullAndEmptyArrays: true } },
        ],
      },
    }, {
      $set: {
        'organizationConnection.edges': {
          $map: {
            // filter any missing/empty org nodes
            input: { $filter: { input: '$organizationConnection.edges', cond: '$$this.node' } },
            in: ['_meta', 'node', 'role'].reduce((o, key) => ({ ...o, [key]: `$$this.${key}` }), {}),
          },
        },
      },
    });
    stages.push({ $project: fullUser() });
    return stages;
  }
}
