import { RepoManager } from '@parameter1/mongodb';

import ApplicationRepo from './application.js';
import TokenRepo from './token.js';
import UserEventRepo from './user-event.js';
import UserRepo from './user.js';

export default class ManagementRepos extends RepoManager {
  /**
   * @todo create change history handlers via change streams
   *       only add items that have a modified date change
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} [params.dbBame=tenancy]
   * @param {string} params.tokenSecret
   */
  constructor({ client, dbName = 'sso@management', tokenSecret } = {}) {
    super({ client, dbName });
    this
      .add({ key: 'application', ManagedRepo: ApplicationRepo })
      .add({ key: 'token', ManagedRepo: TokenRepo, tokenSecret })
      .add({ key: 'user-event', ManagedRepo: UserEventRepo })
      .add({ key: 'user', ManagedRepo: UserRepo });
  }
}
