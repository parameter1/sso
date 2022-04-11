import { RepoManager } from '@parameter1/mongodb';

import ApplicationRepo from './application.js';
import ManagerRepo from './manager.js';
import OrganizationRepo from './organization.js';
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
   *
   * @param {object} params.source
   * @param {string} params.source.name
   * @param {string} params.source.v
   */
  constructor({
    client,
    dbName = 'sso@management',
    tokenSecret,
    source,
  } = {}) {
    super({ client, dbName });
    this
      .add({ key: 'application', source, ManagedRepo: ApplicationRepo })
      .add({ key: 'manager', source, ManagedRepo: ManagerRepo })
      .add({ key: 'organization', source, ManagedRepo: OrganizationRepo })
      .add({
        key: 'token',
        source,
        isVersioned: false,
        ManagedRepo: TokenRepo,
        tokenSecret,
      })
      .add({
        key: 'user-event',
        source,
        isVersioned: false,
        ManagedRepo: UserEventRepo,
      })
      .add({ key: 'user', source, ManagedRepo: UserRepo });
  }
}
