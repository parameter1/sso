import { materializedRepoManager, materializer, normalizer } from '../mongodb.js';
import { commands } from '../service-clients.js';

/**
 *
 * @param {object} params
 * @param {string} params.appKey
 * @param {Map<string, string[]>} params.emailToWorkspaceMap
 * @param {boolean} [params.skip=false]
 */
export async function upsertMembers({ appKey, emailToWorkspaceMap, skip }) {
  if (skip) return;
  const namespaces = [...emailToWorkspaceMap.values()].reduce((set, values) => {
    values.forEach((value) => set.add(`${appKey}/${value}`));
    return set;
  }, new Set());

  const [workspaceMap, userMap] = await Promise.all([
    (async () => {
      const docs = await materializedRepoManager.get('workspace').collection.find({
        'namespace.default': { $in: [...namespaces] },
      }, { projection: { 'namespace.default': 1 } }).toArray();
      return docs.reduce((map, doc) => {
        map.set(doc.namespace.default, doc._id);
        return map;
      }, new Map());
    })(),
    (async () => {
      const docs = await materializedRepoManager.get('user').collection.find({
        email: { $in: [...emailToWorkspaceMap.keys()] },
      }, { projection: { email: 1 } }).toArray();
      return docs.reduce((map, doc) => {
        map.set(doc.email, doc._id);
        return map;
      }, new Map());
    })(),
  ]);

  const input = [...emailToWorkspaceMap].reduce((arr, [email, appNamespaces]) => {
    const userId = userMap.get(email);
    if (!userId) throw new Error(`Unable to retrieve a user ID for email ${email}`);
    appNamespaces.forEach((appNamespace) => {
      const ns = `${appKey}/${appNamespace}`;
      const workspaceId = workspaceMap.get(ns);
      if (!workspaceId) throw new Error(`Unable to retrieve a workspace ID for namespace ${ns}`);
      arr.push({
        entityId: { user: userId, workspace: workspaceId },
        values: { role: 'Member' },
      });
    });
    return arr;
  }, []);

  const results = await commands.request('member.create', {
    input,
    upsert: true,
  });

  const memberIds = [];
  results.forEach(({ entityId }) => {
    memberIds.push(entityId);
  }, new Map());

  // normalize
  await normalizer.normalize({ entityIds: memberIds, entityType: 'member' });
  // then materialize everything
  const types = materializer.getBuilderTypes();
  await Promise.all(types.map((entityType) => materializer.materializeUsingQuery(entityType, {})));
}
