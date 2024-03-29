import { materializer, normalizer } from '../mongodb.js';
import { commands } from '../service-clients.js';

/**
 *
 * @param {object} params
 * @param {import("@parameter1/mongodb-core").ObjectId} params.appId
 * @param {import("../org-manager.js").OrgManager} params.orgManager
 * @param {boolean} [params.skip=false]
 */
export async function upsertWorkspaces({ appId, orgManager, skip }) {
  if (skip) return;
  // upsert the workspaces
  const input = [];
  orgManager.orgs.forEach((org) => {
    org.workspaces.forEach((workspace) => {
      const tenants = [];
      workspace.sources.forEach((map) => {
        map.forEach((source) => {
          tenants.push(source.resolveTenant());
        });
      });
      input.push({
        _sync: { tenants },
        values: {
          appId,
          orgId: org._id,
          key: workspace.key,
          name: workspace.name,
        },
      });
    });
  });
  const results = await commands.request('workspace.create', {
    input,
    upsert: true,
  });

  const workspaceIds = [];
  results.forEach(({ entityId }) => {
    workspaceIds.push(entityId);
  }, new Map());

  // then normalize/materialize.
  await normalizer.normalize({ entityIds: workspaceIds, entityType: 'workspace' });
  await materializer.materialize('workspace', { entityIds: workspaceIds });
}
