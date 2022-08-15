import { PropTypes, attempt, validateAsync } from '@parameter1/prop-types';

import { eventProps } from './command/event-store.js';
import { CommandHandlers } from './command/handlers.js';
import { MaterializedRepos } from './materialized/repos.js';
import { NormalizedRepos } from './normalized/repos.js';
import { mongoDBClientProp } from './props.js';

const { boolean, object, oneOrMany } = PropTypes;

export class EntityManager {
  /**
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor(params) {
    const { client } = attempt(params, object({
      client: mongoDBClientProp.required(),
    }).required());

    this.commandHandlers = new CommandHandlers({ client });
    this.materializedRepos = new MaterializedRepos({ client });
    this.normalizedRepos = new NormalizedRepos({ client });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   * @param {object} [params.$match={}]
   * @param {booleam} [params.withMergeStage=true]
   */
  async materialize(params) {
    const {
      entityType,
      $match,
      withMergeStage,
    } = await validateAsync(object({
      entityType: eventProps.entityType.required(),
      $match: object().default({}),
      withMergeStage: boolean().default(true),
    }).required(), params);

    return this.normalizedRepos.materialize({
      entityType,
      $match,
      withMergeStage,
    });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   * @param {ObjectId|ObjectId[]} params.entityIds
   * @param {boolean} [params.withMergeStage=true]
   */
  async normalize(params) {
    const {
      entityType,
      entityIds,
      withMergeStage,
    } = await validateAsync(object({
      entityType: eventProps.entityType.required(),
      entityIds: oneOrMany(eventProps.entityId).required(),
      withMergeStage: boolean().default(true),
    }).required(), params);

    return this.commandHandlers.normalize({
      entityType,
      entityIds,
      withMergeStage,
    });
  }

  /**
   *
   * @param {string} entityType
   * @returns {BaseCommandHandler}
   */
  getCommandHandler(entityType) {
    return this.commandHandlers.get(entityType);
  }

  getEntityIdType(entityType) {
    const builder = this.commandHandlers.normalizedBuilders.get(entityType);
    return builder.entityIdType;
  }

  /**
   *
   * @param {string} entityType
   * @returns {BaseMaterializedRepo}
   */
  getMaterializedRepo(entityType) {
    return this.materializedRepos.get(entityType);
  }

  /**
   *
   * @param {string} entityType
   * @returns {BaseNormalizedRepo}
   */
  getNormalizedRepo(entityType) {
    return this.normalizedRepos.get(entityType);
  }
}
