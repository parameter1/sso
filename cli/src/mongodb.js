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
import { MaterializedRepoManager } from '@parameter1/sso-mongodb-materialized';
import { NormalizedRepoManager } from '@parameter1/sso-mongodb-normalized';
import { Materializer } from '@parameter1/sso-mongodb-materializers';

import sqsClient from './sqs.js';
import { MONGO_URL, SQS_QUEUE_URL } from './env.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const commandHandler = new CommandHandler({
  reservations: new Reservations({ mongo }),
  sqs: { client: sqsClient, url: SQS_QUEUE_URL },
  store: new EventStore({ mongo }),
});

export const normalizedRepoManager = new NormalizedRepoManager({ mongo });
export const materializedRepoManager = new MaterializedRepoManager({ mongo });
export const materializers = new Materializer({ normalizedRepoManager });

export const applicationCommands = new ApplicationCommands({ handler: commandHandler });
export const organizationCommands = new OrganizationCommands({ handler: commandHandler });
export const managerCommands = new ManagerCommands({ handler: commandHandler });
export const memberCommands = new MemberCommands({ handler: commandHandler });
export const userCommands = new UserCommands({ handler: commandHandler });
export const workspaceCommands = new WorkspaceCommands({ handler: commandHandler });
