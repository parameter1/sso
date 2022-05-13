import clone from 'lodash.clonedeep';

const wrap = (projection) => clone(projection);

const mergeStage = ({ coll }) => ({
  into: { db: 'sso@materialized', coll },
  on: '_id',
  whenMatched: 'replace',
  whenNotMatched: 'insert',
});

const userEdgeProjection = () => wrap({
  '_edge.createdBy': 1,
  '_edge.updatedBy': 1,
});

const globalProjection = () => wrap({
  _date: {
    created: '$_touched.first.date',
    materialized: '$$NOW',
    updated: '$_touched.last.date',
  },
  _deleted: 1,
});

const commonAppProjection = () => wrap({
  ...globalProjection(),
  key: 1,
  name: 1,
  roles: 1,
  slug: 1,
});

const fullAppProjection = () => wrap({
  ...commonAppProjection(),
  ...userEdgeProjection(),
});

const partialAppProjection = () => wrap({
  ...commonAppProjection(),
});

const commonOrgProjection = () => wrap({
  ...globalProjection(),
  emailDomains: 1,
  key: 1,
  name: 1,
  slug: 1,
});

const fullOrgProjection = () => wrap({
  ...commonOrgProjection(),
  ...userEdgeProjection(),
});

const partialOrgProjection = () => wrap({
  ...commonOrgProjection(),
});

const commonUserProjection = () => {
  const global = globalProjection();
  return wrap({
    ...global,
    _date: {
      ...global._date,
      lastLoggedIn: '$lastLoggedInAt',
      lastSeen: '$lastSeenAt',
    },
    domain: 1,
    email: 1,
    familyName: 1,
    givenName: 1,
    loginCount: 1,
    previousEmails: 1,
    slug: 1,
    verified: 1,
  });
};

const fullUserProjection = () => wrap({
  ...commonUserProjection(),
  ...userEdgeProjection(),
  '_connection.organization': 1,
  '_connection.workspace': 1,
});

const partialUserProjection = () => wrap({
  ...commonUserProjection(),
});

const commonWorkspaceProjection = () => wrap({
  ...globalProjection(),
  _deleted: {
    $or: [
      { $eq: ['$_deleted', true] },
      { $eq: ['$_edge.application.node._deleted', true] },
      { $eq: ['$_edge.organization.node._deleted', true] },
    ],
  },
  '_edge.application': 1,
  '_edge.organization': 1,
  key: 1,
  name: 1,
  namespace: {
    $concat: [
      '$_edge.application.node.key', '/',
      '$_edge.organization.node.key', '/',
      '$key',
    ],
  },
  path: {
    $concat: [
      '$_edge.application.node.slug', '/',
      '$_edge.organization.node.slug', '/',
      '$slug',
    ],
  },
  slug: 1,
});

const fullWorkspaceProjection = () => wrap({
  ...commonWorkspaceProjection(),
  ...userEdgeProjection(),
});

const partialWorkspaceProjection = () => wrap({
  ...commonWorkspaceProjection(),
});

const workspaceApplicationStages = () => [
  {
    $lookup: {
      from: 'applications',
      as: '_edge.application.node',
      localField: '_edge.application._id',
      foreignField: '_id',
      pipeline: [{ $project: partialAppProjection() }],
    },
  },
  { $unwind: '$_edge.application.node' },
  { $unset: '_edge.application._id' },
];

const workspaceOrganizationStages = () => [
  {
    $lookup: {
      from: 'organizations',
      as: '_edge.organization.node',
      localField: '_edge.organization._id',
      foreignField: '_id',
      pipeline: [{ $project: partialOrgProjection() }],
    },
  },
  { $unwind: '$_edge.organization.node' },
  { $unset: '_edge.organization._id' },
];

const userAttributionStages = () => [
  {
    $lookup: {
      from: 'users',
      as: '_edge.createdBy.node',
      localField: '_touched.first.user._id',
      foreignField: '_id',
      pipeline: [{ $project: partialUserProjection() }],
    },
  },
  { $unwind: { path: '$_edge.createdBy.node', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'users',
      as: '_edge.updatedBy.node',
      localField: '_touched.last.user._id',
      foreignField: '_id',
      pipeline: [{ $project: partialUserProjection() }],
    },
  },
  { $unwind: { path: '$_edge.updatedBy.node', preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      '_edge.createdBy': {
        $cond: [{ $eq: [{ $ifNull: ['$_edge.createdBy.node', null] }, null] }, null, { node: '$_edge.createdBy.node' }],
      },
      '_edge.updatedBy': {
        $cond: [{ $eq: [{ $ifNull: ['$_edge.updatedBy.node', null] }, null] }, null, { node: '$_edge.updatedBy.node' }],
      },
    },
  },
];

export const buildMaterializedApplicationPipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });
  pipeline.push(...userAttributionStages());
  pipeline.push({ $project: fullAppProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'applications' }) });
  return pipeline;
};

export const buildMaterializedOrganizationPipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });
  pipeline.push(...userAttributionStages());
  pipeline.push({ $project: fullOrgProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'organizations' }) });
  return pipeline;
};

export const buildMaterializedUserPipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });
  pipeline.push(...userAttributionStages());

  // managed organizations
  pipeline.push({
    $lookup: {
      from: 'organizations',
      as: '_connection.organization.edges',
      localField: '_connection.organization.edges._id',
      foreignField: '_id',
      let: { organizations: '$_connection.organization.edges' },
      pipeline: [
        { $sort: { slug: 1 } },
        { $project: partialOrgProjection() },

        {
          $addFields: {
            docs: {
              $filter: { input: '$$organizations', cond: { $eq: ['$$this._id', '$_id'] } },
            },
          },
        },

        { $unset: ['docs._id'] },
        { $unwind: '$docs' },

        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$docs',
                {
                  node: {
                    $arrayToObject: {
                      $filter: {
                        input: { $objectToArray: '$$ROOT' },
                        cond: { $ne: ['$$this.k', 'docs'] },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  });

  // workspace memberships
  pipeline.push({
    $lookup: {
      from: 'workspaces',
      as: '_connection.workspace.edges',
      localField: '_connection.workspace.edges._id',
      foreignField: '_id',
      let: { workspaces: '$_connection.workspace.edges' },

      pipeline: [
        // workspace application
        ...workspaceApplicationStages(),

        // workspace organization
        ...workspaceOrganizationStages(),

        { $project: partialWorkspaceProjection() },
        { $sort: { path: 1 } },
        {
          $addFields: {
            docs: {
              $filter: { input: '$$workspaces', cond: { $eq: ['$$this._id', '$_id'] } },
            },
          },
        },

        { $unset: ['docs._id'] },
        { $unwind: '$docs' },

        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$docs',
                {
                  node: {
                    $arrayToObject: {
                      $filter: {
                        input: { $objectToArray: '$$ROOT' },
                        cond: { $ne: ['$$this.k', 'docs'] },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  });

  // this was moved to a graphql resolver, since filters should be allowed
  // pipeline.push({
  //   $addFields: {
  //     _connection: {
  //       $mergeObjects: [
  //         '$_connection',
  //         {
  //           $reduce: {
  //             input: '$_connection.workspace',
  //             initialValue: {
  //               workspaceApplication: [],
  //               workspaceOrganization: [],
  //             },
  //             in: {
  //               workspaceApplication: {
  //                 $setUnion: [
  //                   '$$value.workspaceApplication',
  //                   [{ node: '$$this.node._edge.application.node' }],
  //                 ],
  //               },
  //               workspaceOrganization: {
  //                 $setUnion: [
  //                   '$$value.workspaceOrganization',
  //                   [{ node: '$$this.node._edge.organization.node' }],
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //       ],
  //     },
  //   },
  // });

  pipeline.push({ $project: fullUserProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'users' }) });
  return pipeline;
};

export const buildMaterializedWorkspacePipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });
  pipeline.push(...userAttributionStages());

  // application
  pipeline.push(...workspaceApplicationStages());

  // organization
  pipeline.push(...workspaceOrganizationStages());

  pipeline.push({ $project: fullWorkspaceProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'workspaces' }) });
  return pipeline;
};
