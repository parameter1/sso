import { RepoManager } from '@parameter1/mongodb';

import OrganizationRepo from './organization.js';
import UserRepo from './user.js';

export default class Repos extends RepoManager {
  constructor({ client, dbName = 'tenancy' } = {}) {
    super({ client, dbName });

    this.add({ key: 'organization', ManagedRepo: OrganizationRepo });
    this.add({ key: 'user', ManagedRepo: UserRepo });
  }
}
