import { MongoClient } from '@parameter1/sso-mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { CommandHandlers, Reservations } from '@parameter1/sso-mongodb-command';

import sqsClient from './sqs.js';
import { MONGO_URL, SQS_QUEUE_URL } from './env.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const reservations = new Reservations({ mongo });
export const store = new EventStore({ mongo });

export const commands = new CommandHandlers({
  reservations,
  sqs: { client: sqsClient, url: SQS_QUEUE_URL },
  store,
});
