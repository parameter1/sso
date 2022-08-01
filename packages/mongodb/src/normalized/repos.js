import { PropTypes, attempt } from '@parameter1/prop-types';
import { mongoDBClientProp } from '../props.js';

import { NormalizedApplicationRepo } from './repos/application.js';

const { object } = PropTypes;

export class NormalizedRepos {
  /**
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor(params) {
    const { client } = attempt(params, object({
      client: mongoDBClientProp.required(),
    }).required());

    this.repos = [
      NormalizedApplicationRepo,
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
   * Gets a normalized repo for the provided entity type.
   *
   * @param {string} entityType
   * @returns {BaseNormalizedRepo}
   */
  get(entityType) {
    const repo = this.repos.get(entityType);
    if (!repo) throw new Error(`No normalized repo exists for entity type '${entityType}'`);
    return repo;
  }
}
