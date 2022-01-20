import { RepoManager } from '@parameter1/mongodb';

import ApplicationRepo from './application.js';
import InstanceRepo from './instance.js';
import OrganizationRepo from './organization.js';
import UserRepo from './user.js';

export default class Repos extends RepoManager {
  constructor({ client, dbName = 'tenancy' } = {}) {
    super({ client, dbName });
    this
      .add({ key: 'application', ManagedRepo: ApplicationRepo })
      .add({ key: 'instance', ManagedRepo: InstanceRepo })
      .add({ key: 'organization', ManagedRepo: OrganizationRepo })
      .add({ key: 'user', ManagedRepo: UserRepo });
  }
}
