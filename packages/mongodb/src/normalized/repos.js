import { PropTypes, attempt } from '@parameter1/prop-types';
import { mongoDBClientProp } from '../props.js';

import { eventProps } from '../command/event-store.js';
import { MaterializedBuilders } from '../materialized/builders.js';

import { NormalizedApplicationRepo } from './repos/application.js';
import { NormalizedUserRepo } from './repos/user.js';

const { boolean, object } = PropTypes;

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
      NormalizedUserRepo,
    ].reduce((map, Repo) => {
      const repo = new Repo({ client });
      map.set(repo.entityType, repo);
      return map;
    }, new Map());

    this.materializedBuilders = new MaterializedBuilders();
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

  keys() {
    return [...this.repos.keys()];
  }

  /**
   * Materializes data from a normalized collection based on the provided entity type and
   * match criteria.
   *
   * @param {object} params
   * @param {string} params.entityType
   * @param {object} [params.$match={}]
   * @param {booleam} [params.withMergeStage=true]
   */
  async materialize(params) {
    const { entityType, $match, withMergeStage } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      $match: object().default({}),
      withMergeStage: boolean().default(true),
    }).required());

    const normalizedRepo = this.get(entityType);
    const pipeline = this.materializedBuilders
      .buildPipelineFor({ entityType, $match, withMergeStage });
    const cursor = await normalizedRepo.aggregate({ pipeline });
    return cursor.toArray();
  }
}
