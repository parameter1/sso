import { RepoManager } from '@parameter1/mongodb';
import AbstractMaterializedRepo from './-abstract.js';

const repos = [
  {
    key: 'application',
    collectionName: 'applications',
    usesSoftDelete: true,
    indexes: [
      { key: { key: 1 }, unique: true },
    ],
  },
  { key: 'organization', collectionName: 'organizations', usesSoftDelete: true },
  { key: 'user', collectionName: 'users', usesSoftDelete: true },
  { key: 'workspace', collectionName: 'workspaces', usesSoftDelete: true },
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
        ManagedRepo: AbstractMaterializedRepo,
      });
    });
  }
}
