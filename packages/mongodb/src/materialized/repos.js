import { PropTypes, attempt } from '@parameter1/prop-types';
import { mongoDBClientProp } from '../props.js';

import { MaterializedApplicationRepo } from './repos/application.js';
import { MaterializedOrganizationRepo } from './repos/organization.js';
import { MaterializedUserRepo } from './repos/user.js';
import { MaterializedWorkspaceRepo } from './repos/workspace.js';

const { object } = PropTypes;

export class MaterializedRepos {
  /**
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor(params) {
    const { client } = attempt(params, object({
      client: mongoDBClientProp.required(),
    }).required());

    this.repos = [
      MaterializedApplicationRepo,
      MaterializedOrganizationRepo,
      MaterializedUserRepo,
      MaterializedWorkspaceRepo,
    ].reduce((map, Repo) => {
      const repo = new Repo({ client });
      map.set(repo.entityType, repo);
      return map;
    }, new Map());
  }

  /**
   * Creates indexes for all registered repos.
   */
  createAllIndexes() {
    return Promise.all([...this.repos.values()].map((repo) => repo.createIndexes()));
  }

  /**
   * Gets a materialized repo for the provided entity type.
   *
   * @param {string} entityType
   * @returns {BaseMaterializedRepo}
   */
  get(entityType) {
    const repo = this.repos.get(entityType);
    if (!repo) throw new Error(`No materialized repo exists for entity type '${entityType}'`);
    return repo;
  }
}
