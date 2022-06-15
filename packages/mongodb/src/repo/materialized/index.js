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
  {
    key: 'workspace',
    collectionName: 'workspaces',
    usesSoftDelete: true,
    indexes: [
      { key: { 'namespace.default': 1 }, unique: true },
    ],
  },
];

export default class MaterializedRepos extends RepoManager {
  /**
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} [params.dbBame=sso]
   */
  constructor({ client, dbName = 'sso', logger } = {}) {
    super({ client, dbName });
    repos.forEach((params) => {
      this.add({
        ...params,
        collectionName: `${params.collectionName}/materialized`,
        logger,
        ManagedRepo: AbstractMaterializedRepo,
      });
    });
  }
}
