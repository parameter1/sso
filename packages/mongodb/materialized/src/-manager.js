import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { mongoClientProp } from '@parameter1/mongodb-prop-types';
import { MongoDBDataLoader } from '@parameter1/mongodb-dataloader';

import { MaterializedApplicationRepo } from './application.js';
import { MaterializedOrganizationRepo } from './organization.js';
import { MaterializedUserRepo } from './user.js';
import { MaterializedWorkspaceRepo } from './workspace.js';

const { object } = PropTypes;

const repos = new Map([
  ['application', MaterializedApplicationRepo],
  ['organization', MaterializedOrganizationRepo],
  ['user', MaterializedUserRepo],
  ['workspace', MaterializedWorkspaceRepo],
]);

/**
 * @typedef {import("./-root").MaterializedRepo} MaterializedRepo
 */
export class MaterializedRepoManager {
  /**
   * @typedef MaterializedRepoManagerConstructorParams
   * @property {MongoClient} mongo
   *
   * @param {MaterializedRepoManagerConstructorParams} params
   */
  constructor(params) {
    /** @type {MaterializedRepoManagerConstructorParams} */
    const { mongo } = attempt(params, object({
      mongo: mongoClientProp.required(),
    }).required());

    this.repos = [...repos.keys()].reduce((map, entityType) => {
      const MaterializedRepo = repos.get(entityType);
      map.set(entityType, new MaterializedRepo({ mongo }));
      return map;
    }, new Map());
  }

  /**
   * Creates all indexes for all registered repos.
   *
   * @returns {Promise<Map<string, string[]>>}
   */
  async createAllIndexes() {
    const results = await Promise.all([...this.repos.keys()].map(async (entityType) => {
      const repo = this.get(entityType);
      const result = await repo.createIndexes();
      return [entityType, result];
    }));
    return new Map(results);
  }

  /**
   *
   * @returns {Map<string, MongoDBDataLoader>}
   */
  createDataloaders() {
    const loaders = new Map();
    this.repos.forEach((repo, entityType) => {
      loaders.set(entityType, new MongoDBDataLoader({
        collection: repo.collection,
        name: entityType,
      }));
    });
    return repos;
  }

  /**
   *
   * @param {string} entityType
   * @returns {MaterializedRepo}
   */
  get(entityType) {
    const repo = this.repos.get(entityType);
    if (!repo) throw new Error(`No materialized repo exists for type '${entityType}'`);
    return repo;
  }
}
