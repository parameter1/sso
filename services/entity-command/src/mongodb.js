import { MongoClient } from '@parameter1/sso-mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import {
  ApplicationCommands,
  OrganizationCommands,
  ManagerCommands,
  MemberCommands,
  UserCommands,
  WorkspaceCommands,

  CommandHandler,
  Reservations,
} from '@parameter1/sso-mongodb-command';

import { MONGO_URL, SQS_QUEUE_URL } from './env.js';
import { sqsClient } from './sqs.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const handler = new CommandHandler({
  reservations: new Reservations({ mongo }),
  sqs: { client: sqsClient, url: SQS_QUEUE_URL },
  store: new EventStore({ mongo }),
});

export const commands = {
  application: new ApplicationCommands({ handler }),
  organization: new OrganizationCommands({ handler }),
  manager: new ManagerCommands({ handler }),
  member: new MemberCommands({ handler }),
  user: new UserCommands({ handler }),
  workspace: new WorkspaceCommands({ handler }),
};
