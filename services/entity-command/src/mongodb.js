import { MongoClient } from '@parameter1/mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import {
  ApplicationCommands,
  OrganizationCommands,
  ManagerCommands,
  MemberCommands,
  UserCommands,
  WorkspaceCommands,
} from '@parameter1/sso-mongodb-command';

import { MONGO_URL, SQS_QUEUE_URL } from './env.js';
import { sqsClient } from './sqs.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const store = new EventStore({ mongo, sqs: { client: sqsClient, url: SQS_QUEUE_URL } });

export const commands = {
  application: new ApplicationCommands({ store }),
  organization: new OrganizationCommands({ store }),
  manager: new ManagerCommands({ store }),
  member: new MemberCommands({ store }),
  user: new UserCommands({ store }),
  workspace: new WorkspaceCommands({ store }),
};
