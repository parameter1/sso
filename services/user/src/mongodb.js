import { MongoClient } from '@parameter1/sso-mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { UserCommands } from '@parameter1/sso-mongodb-command';
import { TokenRepo } from '@parameter1/sso-mongodb-token';
import { UserLogRepo, UserManager } from '@parameter1/sso-mongodb-user-manager';
import { MaterializedRepoManager } from '@parameter1/sso-mongodb-materialized';

import { MONGO_URL, SQS_QUEUE_URL, TOKEN_SECRET } from './env.js';
import { sqsClient } from './sqs.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const store = new EventStore({ mongo, sqs: { client: sqsClient, url: SQS_QUEUE_URL } });
export const commands = new UserCommands({ store });

export const materializedRepoManager = new MaterializedRepoManager({ mongo });

export const tokenRepo = new TokenRepo({ mongo, tokenSecret: TOKEN_SECRET });
export const userLogRepo = new UserLogRepo({ mongo });
export const userManager = new UserManager({
  mongo,
  commands,
  token: tokenRepo,
  materialized: materializedRepoManager.get('user'),
  userLog: userLogRepo,
});
