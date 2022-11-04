import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { mongoDBClientProp } from '@parameter1/sso-mongodb-core';

import { NormalizedApplicationRepo } from './application.js';
import { NormalizedManagerRepo } from './manager.js';
import { NormalizedMemberRepo } from './member.js';
import { NormalizedOrganizationRepo } from './organization.js';
import { NormalizedUserRepo } from './user.js';
import { NormalizedWorkspaceRepo } from './workspace.js';

const { object } = PropTypes;

const repos = new Map([
  ['application', NormalizedApplicationRepo],
  ['manager', NormalizedManagerRepo],
  ['member', NormalizedMemberRepo],
  ['organization', NormalizedOrganizationRepo],
  ['user', NormalizedUserRepo],
  ['workspace', NormalizedWorkspaceRepo],
]);

/**
 * @typedef {import("./-root").NormalizedRepo} NormalizedRepo
 */
export class NormalizedRepoManager {
  /**
   * @typedef NormalizedRepoManagerConstructorParams
   * @property {MongoClient} mongo
   *
   * @param {NormalizedRepoManagerConstructorParams} params
   */
  constructor(params) {
    /** @type {NormalizedRepoManagerConstructorParams} */
    const { mongo } = attempt(params, object({
      mongo: mongoDBClientProp.required(),
    }).required());

    this.repos = [...repos.keys()].reduce((map, entityType) => {
      const NormalizedRepo = repos.get(entityType);
      map.set(entityType, new NormalizedRepo({ mongo }));
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
   * @param {string} entityType
   * @returns {NormalizedRepo}
   */
  get(entityType) {
    const repo = this.repos.get(entityType);
    if (!repo) throw new Error(`No normalized repo exists for type '${entityType}'`);
    return repo;
  }
}
