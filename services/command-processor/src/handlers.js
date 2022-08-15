import { entityManager, materialize } from './mongodb.js';

const materializeWorkspaceUsers = async ({ $match }) => {
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
  const cursor = await entityManager.normalizedRepos.get('workspace').aggregate({ pipeline });
  const result = await cursor.toArray();
  if (!result) return null;
  const [doc] = result;
  if (!doc || !doc.userIds.length) return null;
  return materialize({ entityType: 'user', $match: { _id: { $in: doc.userIds } } });
};

export default {
  /**
   *
   */
  application: ({ entityId }) => Promise.all([
    materialize({ entityType: 'application', $match: { _id: entityId } }),
    materialize({ entityType: 'workspace', $match: { appId: entityId } }),
    materializeWorkspaceUsers({ $match: { appId: entityId } }),
  ]),

  /**
   *
   */
  manager: ({ entityId }) => Promise.all([
    materialize({ entityType: 'organization', $match: { _id: entityId.org } }),
    materialize({ entityType: 'user', $match: { _id: entityId.user } }),
  ]),

  /**
   *
   */
  member: ({ entityId }) => Promise.all([
    materialize({ entityType: 'workspace', $match: { _id: entityId.workspace } }),
    materialize({ entityType: 'user', $match: { _id: entityId.user } }),
  ]),

  /**
   *
   */
  organization: ({ entityId }) => Promise.all([
    materialize({ entityType: 'organization', $match: { _id: entityId } }),
    materialize({ entityType: 'workspace', $match: { orgId: entityId } }),
    materializeWorkspaceUsers({ $match: { orgId: entityId } }),
    (async () => {
      const userIds = await entityManager.normalizedRepos.get('manager').distinct({
        key: '_id.user',
        query: { '_id.org': entityId },
      });
      if (!userIds.length) return null;
      return materialize({ entityType: 'user', $match: { _id: { $in: userIds } } });
    })(),
  ]),

  /**
   *
   */
  user: ({ entityId }) => Promise.all([
    materialize({ entityType: 'user', $match: { _id: entityId } }),
    (async () => {
      const orgIds = await entityManager.normalizedRepos.get('manager').distinct({
        key: '_id.org',
        query: { '_id.user': entityId },
      });
      if (!orgIds.length) return null;
      return materialize({ entityType: 'organization', $match: { _id: { $in: orgIds } } });
    })(),
    (async () => {
      const workspaceIds = await entityManager.normalizedRepos.get('member').distinct({
        key: '_id.workspace',
        query: { '_id.user': entityId },
      });
      if (!workspaceIds.length) return null;
      return materialize({ entityType: 'workspace', $match: { _id: { $in: workspaceIds } } });
    })(),
  ]),

  /**
   *
   */
  workspace: ({ entityId }) => Promise.all([
    materialize({ entityType: 'workspace', $match: { _id: entityId } }),
    (async () => {
      const userIds = await entityManager.normalizedRepos.get('member').distinct({
        key: '_id.user',
        query: { '_id.workspace': entityId },
      });
      if (!userIds.length) return null;
      return materialize({ entityType: 'user', $match: { _id: { $in: userIds } } });
    })(),
  ]),
};
