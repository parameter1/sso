/* eslint-disable no-await-in-loop */
import { filterMongoURL } from '@parameter1/sso-mongodb';
import { immediatelyThrow } from '@parameter1/utils';
import process from 'process';

import pkg from '../package.js';
import { mongodb } from './mongodb.js';
import { processChangeEvent } from './process-change-event.js';
import { pubSubManager } from './pubsub.js';
import { findResumeToken, createChangeStream } from './utils.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;
const debug = true;

const listenForChanges = async ({ useResumeToken } = {}) => {
  const token = useResumeToken ? await findResumeToken() : null;
  if (debug) {
    if (token) {
      log(`Starting after ${JSON.stringify(token)}`);
    } else {
      log('Starting from beginning of oplog');
    }
  }
  const changeStream = await createChangeStream({ token });
  try {
    while (await changeStream.hasNext()) {
      const change = await changeStream.next();
      await processChangeEvent(change, { debug });
    }
  } catch (e) {
    if (e.codeName === 'ChangeStreamHistoryLost') {
      // re-initialize the change stream without the resume token.
      // @todo log this!
      if (debug) log('Resume token is no longer available. Closing current stream and re-opening...');
      await changeStream.close();
      await listenForChanges({ useResumeToken: false });
    } else {
      throw e;
    }
  }
};

/**
 * @todo partition the change stream services so multiple containers can run
 */
(async () => {
  log(`Booting ${pkg.name} v${pkg.version}...`);
  // start services here
  await Promise.all([
    (async () => {
      log('Connecting to MongoDB...');
      const c = await mongodb.connect();
      log(`MongoDB connected on ${filterMongoURL(c)}`);
    })(),
    (async () => {
      log('Connecting to Redis pub/sub...');
      await pubSubManager.connect();
      log('Redis connected.');
    })(),
  ]);

  await listenForChanges({ useResumeToken: true });
})().catch(immediatelyThrow);
