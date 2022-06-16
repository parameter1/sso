import { RepoManager } from '@parameter1/mongodb';

import ApplicationRepo from './application.js';
import OrganizationRepo from './organization.js';
import TokenRepo from './token.js';
import UserEventRepo from './user-event.js';
import UserRepo from './user.js';
import WorkspaceRepo from './workspace.js';

export default class ManagedRepos extends RepoManager {
  /**
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} [params.dbBame=sso]
   * @param {string} params.tokenSecret
   *
   * @param {object} params.source
   * @param {string} params.source.name
   * @param {string} params.source.v
   */
  constructor({
    client,
    dbName = 'sso',
    tokenSecret,
    source,
  } = {}) {
    super({ client, dbName });
    this
      .add({
        key: 'application',
        source,
        isVersioned: false, // determine better way of versioning...
        usesSoftDelete: false, // we may want to bring this back, but have it auto-delete after time
        ManagedRepo: ApplicationRepo,
      })
      .add({
        key: 'organization',
        source,
        isVersioned: false, // determine better way of versioning...
        usesSoftDelete: false, // we may want to bring this back, but have it auto-delete after time
        ManagedRepo: OrganizationRepo,
      })
      .add({
        key: 'token',
        source,
        isVersioned: false,
        usesSoftDelete: false,
        ManagedRepo: TokenRepo,
        tokenSecret,
      })
      .add({
        key: 'user-event',
        source,
        isVersioned: false,
        usesSoftDelete: false,
        ManagedRepo: UserEventRepo,
      })
      .add({
        key: 'user',
        source,
        isVersioned: false, // determine better way of versioning...
        usesSoftDelete: false, // we may want to bring this back, but have it auto-delete after time
        ManagedRepo: UserRepo,
      })
      .add({
        key: 'workspace',
        source,
        isVersioned: false, // determine better way of versioning...
        usesSoftDelete: false, // we may want to bring this back, but have it auto-delete after time
        ManagedRepo: WorkspaceRepo,
      });
  }
}
