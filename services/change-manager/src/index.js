import { filterMongoURL } from '@parameter1/sso-mongodb';
import { immediatelyThrow } from '@parameter1/utils';

import { runHandlerFor } from './handlers.js';
import pkg from '../package.js';
import mongodb from './mongodb.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

/**
 * @todo needs graceful shutdown and restart
 * @todo determine how to cache resume tokens and handle on fail/shutdown
 * @todo partition the change stream services so multiple containers can run
 */
(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here
  log('Connecting to MongoDB...');
  const client = await mongodb.connect();
  log(`MongoDB connected on ${filterMongoURL(client)}`);

  const changeStream = client.watch([
    {
      $match: {
        'ns.db': 'sso',
        'ns.coll': /^[a-z0-9-]+[^\\/materialized]$/,
      },
    },
  ], {
    // fullDocument: 'updateLookup',
  });
  changeStream.on('change', async (change) => {
    await runHandlerFor(change);
  });
})().catch(immediatelyThrow);
