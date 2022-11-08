import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { NormalizedRepoManager } from '@parameter1/sso-mongodb-normalized';

import { ApplicationPipelineBuilder } from './pipeline-builders/application.js';
import { OrganizationPipelineBuilder } from './pipeline-builders/organization.js';
import { UserPipelineBuilder } from './pipeline-builders/user.js';
import { WorkspacePipelineBuilder } from './pipeline-builders/workspace.js';

import handlers from './handlers.js';

const { object, oneOrMany } = PropTypes;

const builders = new Map([
  ['application', ApplicationPipelineBuilder],
  ['organization', OrganizationPipelineBuilder],
  ['user', UserPipelineBuilder],
  ['workspace', WorkspacePipelineBuilder],
]);

export class Materializer {
  /**
   *
   * @param {object} params
   * @param {NormalizedRepoManager} params.normalizedRepoManager
   */
  constructor(params) {
    const { normalizedRepoManager } = attempt(params, object({
      normalizedRepoManager: object().instance(NormalizedRepoManager).required(),
    }).required());

    this.builders = [...builders.keys()].reduce((map, entityType) => {
      const PipelineBuilder = builders.get(entityType);
      map.set(entityType, new PipelineBuilder());
      return map;
    }, new Map());

    /** @type {NormalizedRepoManager} */
    this.normalizedRepoManager = normalizedRepoManager;
  }

  /**
   * Builds the materialized aggregation pipeline for the provided entity type.
   *
   * @param {string} entityType
   * @param {object} $match
   */
  buildPipelineFor(entityType, $match = {}) {
    const builder = this.builders.get(entityType);
    return builder ? builder.buildPipeline($match) : null;
  }

  /**
   *
   * @returns {string[]}
   */
  getBuilderTypes() {
    return [...this.builders.keys()].sort();
  }

  /**
   * Materializes data from a normalized collection based on the provided entity match criteria.
   *
   * This method will bail if no materialization builder is found for the entity type.
   *
   * @param {string} entityType
   * @param {object} params
   * @param {object} [$match = {}]
   */
  async materializeUsingQuery(entityType, $match = {}) {
    const pipeline = this.buildPipelineFor(entityType, $match);
    if (!pipeline) return null;
    const repo = this.normalizedRepoManager.get(entityType);
    return repo.collection.aggregate(pipeline).toArray();
  }

  /**
   * Materializes the provided entity IDs and all related data.
   *
   * @param {string} type
   * @param {object} params
   * @param {*|*[]} params.entityIds
   */
  async materialize(type, params) {
    const entityType = attempt(type, eventProps.entityType.required());
    const { entityIds } = await validateAsync(object({
      entityIds: oneOrMany(getEntityIdPropType(entityType).required()).required(),
    }).required(), params);

    const handler = handlers[entityType];
    const materialize = this.materializeUsingQuery.bind(this);
    if (handler) {
      return handler({ entityIds }, {
        materialize,
        normalizedRepoManager: this.normalizedRepoManager,
      });
    }
    return this.materializeUsingQuery(entityType, { _id: { $in: entityIds } });
  }
}
