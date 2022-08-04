import { BaseBuilder } from './-base.js';
import {
  fullWorkspace,
  partialApplication,
  partialOrganization,
  partialUser,
} from './-projections.js';

export class WorkspaceBuilder extends BaseBuilder {
  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   */
  constructor() {
    super({ entityType: 'workspace' });
  }

  static buildPipelineStages() {
    const stages = [];
    // application
    stages.push(...WorkspaceBuilder.applicationStages());
    // organization
    stages.push(...WorkspaceBuilder.organizationStages());
    // members
    stages.push({
      $lookup: {
        from: 'member/normalized',
        localField: '_id',
        foreignField: '_id.workspace',
        as: '_connection.member.edges',
        pipeline: [
          // do not include deleted members
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
          { $unwind: { path: '$node', preserveNullAndEmptyArrays: true } },
          // discard any missing users
          { $match: { $expr: { $ne: ['$node', null] } } },
        ],
      },
    }, {
      $set: {
        '_connection.member.edges': {
          $map: {
            // set edge fields
            input: '$_connection.member.edges',
            in: ['_meta', 'node', 'role'].reduce((o, key) => ({ ...o, [key]: `$$this.${key}` }), {}),
          },
        },
      },
    });
    stages.push({ $project: fullWorkspace() });
    return stages;
  }

  static applicationStages() {
    return [
      {
        $lookup: {
          from: 'application/normalized',
          localField: 'appId',
          foreignField: '_id',
          as: '_edge.application.node',
          pipeline: [
            { $project: partialApplication() },
          ],
        },
      }, {
        // flatten the app into a single object
        $unwind: { path: '$_edge.application.node', preserveNullAndEmptyArrays: true },
      }, {
        $set: {
          // mark the workspace as deleted if the app is deleted.
          _deleted: {
            $cond: [{ $eq: ['$_edge.application.node._deleted', true] }, true, '$_deleted'],
          },
        },
      },
    ];
  }

  static organizationStages() {
    return [
      {
        $lookup: {
          from: 'organization/normalized',
          localField: 'orgId',
          foreignField: '_id',
          as: '_edge.organization.node',
          pipeline: [
            { $project: partialOrganization() },
          ],
        },
      }, {
        // flatten the org into a single object
        $unwind: { path: '$_edge.organization.node', preserveNullAndEmptyArrays: true },
      }, {
        $set: {
          // mark the workspace as deleted if the org is deleted.
          _deleted: {
            $cond: [{ $eq: ['$_edge.organization._deleted', true] }, true, '$_deleted'],
          },
        },
      },
    ];
  }
}
