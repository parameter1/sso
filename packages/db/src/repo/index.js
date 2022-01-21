import { RepoManager } from '@parameter1/mongodb';

import ApplicationRepo from './application.js';
import InstanceRepo from './instance.js';
import ManagerRepo from './manager.js';
import MemberRepo from './member.js';
import OrganizationRepo from './organization.js';
import TokenRepo from './token.js';
import UserEventRepo from './user-event.js';
import UserRepo from './user.js';
import WorkspaceRepo from './workspace.js';

export default class Repos extends RepoManager {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} [params.dbBame=tenancy]
   * @param {string} params.tokenSecret
   */
  constructor({ client, dbName = 'tenancy', tokenSecret } = {}) {
    super({ client, dbName });
    this
      .add({ key: 'application', ManagedRepo: ApplicationRepo })
      .add({ key: 'instance', ManagedRepo: InstanceRepo })
      .add({ key: 'manager', ManagedRepo: ManagerRepo })
      .add({ key: 'member', ManagedRepo: MemberRepo })
      .add({ key: 'organization', ManagedRepo: OrganizationRepo })
      .add({ key: 'token', ManagedRepo: TokenRepo, tokenSecret })
      .add({ key: 'user', ManagedRepo: UserRepo })
      .add({ key: 'user-event', ManagedRepo: UserEventRepo })
      .add({ key: 'workspace', ManagedRepo: WorkspaceRepo });
  }
}
