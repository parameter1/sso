import { MongoClient } from '@parameter1/sso-mongodb-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import {
  UserCommands,
} from '@parameter1/sso-mongodb-command';
import { MaterializedRepoManager } from '@parameter1/sso-mongodb-materialized';
import { NormalizedRepoManager } from '@parameter1/sso-mongodb-normalized';
import { Materializer } from '@parameter1/sso-mongodb-materializers';
import { TokenRepo } from '@parameter1/sso-mongodb-token';
import { UserLogRepo, UserManager } from '@parameter1/sso-mongodb-user-manager';

import sqsClient from './sqs.js';
import { MONGO_URL, SQS_QUEUE_URL, TOKEN_SECRET } from './env.js';
import pkg from '../package.js';

export const mongo = new MongoClient(MONGO_URL, {
  appname: `${pkg.name} v${pkg.version}`,
});

export const store = new EventStore({ mongo, sqs: { client: sqsClient, url: SQS_QUEUE_URL } });

export const normalizedRepoManager = new NormalizedRepoManager({ mongo });
export const materializedRepoManager = new MaterializedRepoManager({ mongo });
export const materializers = new Materializer({ normalizedRepoManager });

export const userCommands = new UserCommands({ store });

export const tokenRepo = new TokenRepo({ mongo, tokenSecret: TOKEN_SECRET });
export const userLogRepo = new UserLogRepo({ mongo });
export const userManager = new UserManager({
  mongo,
  commands: userCommands,
  token: tokenRepo,
  materialized: materializedRepoManager.get('user'),
  userLog: userLogRepo,
});
