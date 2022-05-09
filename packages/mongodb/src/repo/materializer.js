import clone from 'lodash.clonedeep';
import { isFunction as isFn } from '@parameter1/utils';

const wrap = (projection, formatter) => {
  const cloned = clone(projection);
  return isFn(formatter) ? formatter(cloned) : cloned;
};

const mergeStage = ({ coll }) => ({
  into: { db: 'sso@materialized', coll },
  on: '_id',
  whenMatched: 'replace',
  whenNotMatched: 'insert',
});

/**
 * Set the objects key to `undefined` if a default field should be removed.
 *
 * @param {function} fn Add custom field projection and/or remove standard fields.
 * @returns {object}
 */
const dateProjection = (fn) => wrap({
  _date: {
    created: '$_touched.first.date',
    materialized: '$$NOW',
    updated: '$_touched.last.date',
  },
}, fn);

const standardProjection = (fn) => wrap({
  _connection: 1,
  _edge: 1,
  _deleted: 1,
  ...dateProjection(),
}, fn);

const applicationProjection = (fn) => wrap({
  ...standardProjection(),
  key: 1,
  name: 1,
  roles: 1,
  slug: 1,
}, fn);

const organizationProjection = (fn) => wrap({
  ...standardProjection(),
  emailDomains: 1,
  key: 1,
  name: 1,
  slug: 1,
}, fn);

const userProjection = (fn) => wrap({
  ...standardProjection(),
  domain: 1,
  email: 1,
  familyName: 1,
  givenName: 1,
  previousEmails: 1,
  slug: 1,
  verified: 1,
}, fn);

const workspaceProjection = (fn) => wrap({
  ...standardProjection(),
  key: 1,
  name: 1,
  path: {
    $concat: [
      '$_edge.application.node.slug', '/',
      '$_edge.organization.node.slug', '/',
      '$slug',
    ],
  },
  slug: 1,
}, fn);

const workspaceApplicationStages = () => [
  {
    $lookup: {
      from: 'applications',
      as: '_edge.application.node',
      localField: 'application._id',
      foreignField: '_id',
      pipeline: [
        { $match: { $expr: { $eq: ['$_deleted', false] } } },
        {
          $project: applicationProjection((project) => {
            const p = { ...project };
            delete p._deleted;
            return p;
          }),
        },
      ],
    },
  },
  { $unwind: '$_edge.application.node' },
];

const workspaceOrganizationStages = () => [
  {
    $lookup: {
      from: 'organizations',
      as: '_edge.organization.node',
      localField: 'organization._id',
      foreignField: '_id',
      pipeline: [
        { $match: { $expr: { $eq: ['$_deleted', false] } } },
        {
          $project: organizationProjection((project) => {
            const p = { ...project };
            delete p._deleted;
            return p;
          }),
        },
      ],
    },
  },
  { $unwind: '$_edge.organization.node' },
];

export const buildApplicationPipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });
  pipeline.push({ $project: applicationProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'applications' }) });
  return pipeline;
};

export const buildOrganizationPipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });
  pipeline.push({ $project: organizationProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'organizations' }) });
  return pipeline;
};

export const buildMaterializedUserPipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });

  // managed organizations
  pipeline.push({
    $lookup: {
      from: 'organizations',
      as: '_connection.organization',
      localField: 'organizations._id',
      foreignField: '_id',
      let: { organizations: '$organizations' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_deleted', false] } } },
        { $sort: { slug: 1 } },
        { $project: organizationProjection() },

        {
          $addFields: {
            docs: {
              $filter: { input: '$$organizations', cond: { $eq: ['$$this._id', '$_id'] } },
            },
          },
        },

        { $unset: ['docs._id', '_deleted'] },
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
      as: '_connection.workspace',
      localField: 'workspaces._id',
      foreignField: '_id',
      let: { workspaces: '$workspaces' },

      pipeline: [
        { $match: { $expr: { $eq: ['$_deleted', false] } } },

        // workspace application
        ...workspaceApplicationStages(),

        // workspace organization
        ...workspaceOrganizationStages(),

        { $project: workspaceProjection() },
        { $sort: { path: 1 } },
        {
          $addFields: {
            docs: {
              $filter: { input: '$$workspaces', cond: { $eq: ['$$this._id', '$_id'] } },
            },
          },
        },

        { $unset: ['docs._id', '_deleted'] },
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

  // workspace applications and organizations
  // NOTE: this are _NOT_ sorted by slug
  // @todo sort using `$sortArray` once available
  pipeline.push({
    $addFields: {
      _connection: {
        $mergeObjects: [
          '$_connection',
          {
            $reduce: {
              input: '$_connection.workspace',
              initialValue: {
                workspaceApplication: [],
                workspaceOrganization: [],
              },
              in: {
                workspaceApplication: {
                  $setUnion: [
                    '$$value.workspaceApplication',
                    [{ node: '$$this.node._edge.application.node' }],
                  ],
                },
                workspaceOrganization: {
                  $setUnion: [
                    '$$value.workspaceOrganization',
                    [{ node: '$$this.node._edge.organization.node' }],
                  ],
                },
              },
            },
          },
        ],
      },
    },
  });

  pipeline.push({ $project: userProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'users' }) });
  return pipeline;
};

export const buildMaterializedWorkspacePipeline = ({ $match = {}, withMerge = true } = {}) => {
  const pipeline = [];
  pipeline.push({ $match });
  pipeline.push({ $sort: { _id: 1 } });

  // application
  pipeline.push(...workspaceApplicationStages());

  // organization
  pipeline.push(...workspaceOrganizationStages());

  pipeline.push({ $project: workspaceProjection() });
  if (withMerge) pipeline.push({ $merge: mergeStage({ coll: 'workspaces' }) });
  return pipeline;
};
