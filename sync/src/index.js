import { filterMongoURL } from '@parameter1/mongodb-core';
import { immediatelyThrow } from '@parameter1/utils';
import { createOrgManager } from './org-factory.js';
import {
  aquaria,
  mongo,
  materializedRepoManager,
  tauron,
  virgon,
} from './mongodb.js';

import { upsertOrgs } from './actions/upsert-orgs.js';
import { upsertWorkspaces } from './actions/upsert-workspaces.js';
import { upsertUsers } from './actions/upsert-users.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

const orgManager = createOrgManager();

(async () => {
  const mongos = [
    { client: mongo, name: 'SSO' },
    { client: aquaria, name: 'Aquaria' },
    { client: tauron, name: 'Tauron' },
    { client: virgon, name: 'Virgon' },
  ];
  await Promise.all(mongos.map(async ({ client, name }) => {
    log(`> Connecting to ${name} MongoDB...`);
    const c = await client.connect();
    log(`> MongoDB ${name} connected on ${filterMongoURL(c)}`);
  }));

  // load the app
  const app = await materializedRepoManager.get('application').findByKey('mindful', {
    projection: { _id: 1 },
  });
  if (!app) throw new Error('Unable to load the mindful app');

  // handle orgs
  log('> Upserting organizations...');
  await upsertOrgs({ orgManager });
  // handle workspaces
  log('> Upserting workspaces...');
  await upsertWorkspaces({ appId: app._id, orgManager });
  // handle users
  log('> Upserting users...');
  await upsertUsers({ orgManager });

  await Promise.all(mongos.map(async ({ client, name }) => {
    log(`> Closing ${name} MongoDB...`);
    await client.close();
    log(`> MongoDB ${name} closed`);
  }));
})().catch(immediatelyThrow);
