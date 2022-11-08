/**
 * @typedef {import("@parameter1/sso-mongodb-normalized")
 *  .NormalizedRepoManager} NormalizedRepoManager
 *
 * @typedef MaterializeHandlerParams
 * @property {*[]} entityIds
 *
 * @typedef MaterializeHandlerFunctions
 * @property {function} materialize
 * @property {NormalizedRepoManager} normalizedRepoManager
 *
 */

/**
 *
 * @param {object} $match
 * @param {MaterializeHandlerFunctions} functions
 */
const materializeWorkspaceUsers = async ($match, { materialize, normalizedRepoManager }) => {
  const pipeline = [{
    $match,
  }, {
    $group: { _id: null, workspaceIds: { $addToSet: '$_id' } },
  }, {
    $lookup: {
      from: 'member/normalized',
      localField: 'workspaceIds',
      foreignField: '_id.workspace',
      as: 'members',
      pipeline: [{ $project: { _id: 0, userId: '$_id.user' } }],
    },
  }, {
    $project: { userIds: { $map: { input: '$members', in: '$$this.userId' } } },
  }];
  // @todo the initial lookups to return the IDs doubles the overall materialization time
  // determine if this can all be done in one $merge stage
  const repo = normalizedRepoManager.get('workspace');
  const result = await repo.collection.aggregate(pipeline).toArray();
  if (!result) return null;
  const [doc] = result;
  if (!doc || !doc.userIds.length) return null;
  return materialize('user', { _id: { $in: doc.userIds } });
};

export default {
  /**
   * @param {MaterializeHandlerParams} params
   * @param {MaterializeHandlerFunctions} functions
   */
  application: ({ entityIds }, { materialize, normalizedRepoManager }) => Promise.all([
    materialize('application', { _id: { $in: entityIds } }),
    materialize('workspace', { appId: { $in: entityIds } }),
    materializeWorkspaceUsers({ appId: { $in: entityIds } }, {
      materialize,
      normalizedRepoManager,
    }),
  ]),

  /**
   * @param {MaterializeHandlerParams} params
   * @param {MaterializeHandlerFunctions} functions
   */
  manager: ({ entityIds }, { materialize }) => Promise.all([
    materialize('organization', { _id: { $in: entityIds.map(({ org }) => org) } }),
    materialize('user', { _id: { $in: entityIds.map(({ user }) => user) } }),
  ]),

  /**
   * @param {MaterializeHandlerParams} params
   * @param {MaterializeHandlerFunctions} functions
   */
  member: ({ entityIds }, { materialize }) => Promise.all([
    materialize('workspace', { _id: { $in: entityIds.map(({ workspace }) => workspace) } }),
    materialize('user', { _id: { $in: entityIds.map(({ user }) => user) } }),
  ]),

  /**
   * @param {MaterializeHandlerParams} params
   * @param {MaterializeHandlerFunctions} functions
   */
  organization: ({ entityIds }, { materialize, normalizedRepoManager }) => Promise.all([
    materialize('organization', { _id: { $in: entityIds } }),
    materialize('workspace', { orgId: { $in: entityIds } }),
    materializeWorkspaceUsers({ orgId: { $in: entityIds } }, {
      materialize,
      normalizedRepoManager,
    }),
    (async () => {
      const repo = normalizedRepoManager.get('manager');
      const userIds = await repo.collection.distinct('_id.user', {
        '_id.org': { $in: entityIds },
      });
      if (!userIds.length) return null;
      return materialize('user', { _id: { $in: userIds } });
    })(),
  ]),

  /**
   * @param {MaterializeHandlerParams} params
   * @param {MaterializeHandlerFunctions} functions
   */
  user: ({ entityIds }, { materialize, normalizedRepoManager }) => Promise.all([
    materialize('user', { _id: { $in: entityIds } }),
    (async () => {
      const repo = normalizedRepoManager.get('manager');
      const orgIds = await repo.collection.distinct('_id.org', {
        '_id.user': { $in: entityIds },
      });
      if (!orgIds.length) return null;
      return materialize('organization', { _id: { $in: orgIds } });
    })(),
    (async () => {
      const repo = normalizedRepoManager.get('member');
      const workspaceIds = await repo.collection.distinct('_id.workspace', {
        '_id.user': { $in: entityIds },
      });
      if (!workspaceIds.length) return null;
      return materialize('workspace', { _id: { $in: workspaceIds } });
    })(),
  ]),

  /**
   * @param {MaterializeHandlerParams} params
   * @param {MaterializeHandlerFunctions} functions
   */
  workspace: ({ entityIds }, { materialize, normalizedRepoManager }) => Promise.all([
    materialize('workspace', { _id: { $in: entityIds } }),
    (async () => {
      const repo = normalizedRepoManager.get('member');
      const userIds = await repo.collection.distinct('_id.user', {
        '_id.workspace': { $in: entityIds },
      });
      if (!userIds.length) return null;
      return materialize('user', { _id: { $in: userIds } });
    })(),
  ]),
};
