import { BaseBuilder } from './-base.js';
import { fullUser, fullWorkspace, partialOrganization } from './-projections.js';
import { WorkspaceBuilder } from './workspace.js';

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

    // organization managerships
    stages.push({
      $lookup: {
        from: 'manager/normalized',
        localField: '_id',
        foreignField: '_id.user',
        as: '_connection.organization.edges',
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
          // discard any missing orgs
          { $match: { $expr: { $ne: ['$node', null] } } },
        ],
      },
    }, {
      $set: {
        '_connection.organization.edges': {
          $map: {
            // set edge fields
            input: '$_connection.organization.edges',
            in: ['_meta', 'node', 'role'].reduce((o, key) => ({ ...o, [key]: `$$this.${key}` }), {}),
          },
        },
      },
    });

    // workspace memberships
    stages.push({
      $lookup: {
        from: 'member/normalized',
        localField: '_id',
        foreignField: '_id.user',
        as: '_connection.workspace.edges',
        pipeline: [
          // do not include deleted members
          { $match: { $expr: { $eq: ['$_deleted', false] } } },
          // drop history
          { $project: { _history: 0 } },
          // lookup the workspace
          {
            $lookup: {
              from: 'workspace/normalized',
              localField: '_id.workspace',
              foreignField: '_id',
              as: 'node',
              pipeline: [
                ...WorkspaceBuilder.applicationStages(),
                ...WorkspaceBuilder.organizationStages(),
                { $project: fullWorkspace() },
                // drop history
                { $unset: ['_history'] },
                // do not include deleted workspaces
                // (run after app and org deletions are accounted for)
                { $match: { $expr: { $eq: ['$_deleted', false] } } },
              ],
            },
          },
          // flatten the workspace into a single object
          { $unwind: { path: '$node', preserveNullAndEmptyArrays: true } },
          // discard any missing workspaces
          { $match: { $expr: { $ne: ['$node', null] } } },
        ],
      },
    }, {
      $set: {
        '_connection.workspace.edges': {
          $map: {
            // set edge fields
            input: '$_connection.workspace.edges',
            in: ['_meta', 'node', 'role'].reduce((o, key) => ({ ...o, [key]: `$$this.${key}` }), {}),
          },
        },
      },
    });

    stages.push({ $project: fullUser() });
    return stages;
  }
}
