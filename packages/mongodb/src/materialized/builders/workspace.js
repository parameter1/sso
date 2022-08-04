import { BaseBuilder } from './-base.js';
import { fullWorkspace, partialApplication, partialOrganization } from './-projections.js';

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
