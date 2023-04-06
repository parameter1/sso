import { materializer, normalizer } from '../mongodb.js';
import { commands } from '../service-clients.js';

/**
 *
 * @param {object} params
 * @param {import("../org-manager.js").OrgManager} params.orgManager
 */
export async function upsertOrgs({ orgManager }) {
  // upsert the orgs
  const input = [...orgManager.orgs.values()].reduce((arr, org) => {
    arr.push({ values: { key: org.key, name: org.name, website: org.website } });
    return arr;
  }, []);

  const results = await commands.request('organization.create', {
    input,
    upsert: true,
  });

  const orgIds = [];
  results.forEach(({ entityId, values }) => {
    orgIds.push(entityId);
    orgManager.get(values.key).setId(entityId);
  }, new Map());

  // then normalize/materialize.
  await normalizer.normalize({ entityIds: orgIds, entityType: 'organization' });
  await materializer.materialize('organization', { entityIds: orgIds });
}
