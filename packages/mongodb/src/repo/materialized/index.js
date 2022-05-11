import { RepoManager, ManagedRepo } from '@parameter1/mongodb';

const DELETED_PATH = '_deleted';

const repos = [
  { key: 'application', collectionName: 'applications', indexes: [] },
  { key: 'organization', collectionName: 'organizations', indexes: [] },
  { key: 'user', collectionName: 'users', indexes: [] },
  { key: 'workspace', collectionName: 'workspaces', indexes: [] },
];

export default class MaterializedRepos extends RepoManager {
  /**
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} [params.dbBame=sso@materialized]
   */
  constructor({ client, dbName = 'sso@materialized', logger } = {}) {
    super({ client, dbName });
    repos.forEach((params) => {
      this.add({
        ...params,
        logger,
        globalFindCriteria: { [DELETED_PATH]: false },
        ManagedRepo,
      });
    });
  }
}
