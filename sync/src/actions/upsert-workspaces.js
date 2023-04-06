import { materializer, normalizer } from '../mongodb.js';
import { commands } from '../service-clients.js';

/**
 *
 * @param {object} params
 * @param {import("@parameter1/mongodb-core").ObjectId} params.appId
 * @param {import("../org-manager.js").OrgManager} params.orgManager
 */
export async function upsertWorkspaces({ appId, orgManager }) {
  // upsert the workspaces
  const input = [];
  orgManager.orgs.forEach((org) => {
    org.workspaces.forEach((workspace) => {
      input.push({
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
