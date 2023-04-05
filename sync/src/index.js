import { filterMongoURL } from '@parameter1/mongodb-core';
import { immediatelyThrow } from '@parameter1/utils';
import { commands } from './service-clients.js';
import { createOrgManager } from './org-factory.js';
import { mongo, materializer, normalizer } from './mongodb.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

const orgManager = createOrgManager();

(async () => {
  log('> Connecting to MongoDB...');
  await mongo.connect();
  log(`> MongoDB connection to ${filterMongoURL(mongo)}`);

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

  log('> Closing to MongoDB...');
  await mongo.close();
  log('> MongoDB closed');
})().catch(immediatelyThrow);
