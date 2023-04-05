import { filterMongoURL } from '@parameter1/mongodb-core';
import { immediatelyThrow } from '@parameter1/utils';
import { commands } from './service-clients.js';
import { createOrgManager } from './org-factory.js';
import {
  mongo,
  materializedRepoManager,
  materializer,
  normalizer,
} from './mongodb.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

const orgManager = createOrgManager();

(async () => {
  log('> Connecting to MongoDB...');
  await mongo.connect();
  log(`> MongoDB connection to ${filterMongoURL(mongo)}`);

  // load the app
  const app = await materializedRepoManager.get('application').findByKey('mindful', {
    projection: { _id: 1 },
  });
  if (!app) throw new Error('Unable to load the mindful app');

  // upsert the orgs
  const orgInput = [...orgManager.orgs.values()].reduce((arr, org) => {
    arr.push({ values: { key: org.key, name: org.name, website: org.website } });
    return arr;
  }, []);
  const results = await commands.request('organization.create', {
    input: orgInput,
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

  // upsert the workspaces
  const workspaceInput = [];
  orgManager.orgs.forEach((org) => {
    org.workspaces.forEach((workspace) => {
      workspaceInput.push({
        values: {
          appId: app._id,
          orgId: org._id,
          key: workspace.key,
          name: workspace.name,
        },
      });
    });
  });
  const workspaceResults = await commands.request('workspace.create', {
    input: workspaceInput,
    upsert: true,
  });

  const workspaceIds = [];
  workspaceResults.forEach(({ entityId }) => {
    workspaceIds.push(entityId);
  }, new Map());

  // then normalize/materialize.
  await normalizer.normalize({ entityIds: workspaceIds, entityType: 'workspace' });
  await materializer.materialize('workspace', { entityIds: workspaceIds });

  log('> Closing to MongoDB...');
  await mongo.close();
  log('> MongoDB closed');
})().catch(immediatelyThrow);
