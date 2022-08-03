import { PropTypes, attempt } from '@parameter1/prop-types';

import { eventProps } from '../command/event-store.js';

import { ApplicationBuilder } from './builders/application.js';
import { OrganizationBuilder } from './builders/organization.js';
import { UserBuilder } from './builders/user.js';

const { boolean, object } = PropTypes;

export class MaterializedBuilders {
  /**
   *
   */
  constructor() {
    this.classes = new Map();
    this.builders = [
      ApplicationBuilder,
      OrganizationBuilder,
      UserBuilder,
    ].reduce((map, Builder) => {
      const builder = new Builder();
      this.classes.set(builder.entityType, Builder);
      map.set(builder.entityType, builder);
      return map;
    }, new Map());
  }

  /**
   *
   * @param {object} params
   * @param {string} params.entityType
   * @param {object} [params.$match={}]
   * @param {booleam} [params.withMergeStage=true]
   * @return {object[]}
   */
  buildPipelineFor(params) {
    const { entityType, $match, withMergeStage } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      $match: object().default({}),
      withMergeStage: boolean().default(true),
    }).required());
    return this.get(entityType).buildPipeline({
      $match,
      stages: this.classes.get(entityType).buildPipelineStages(),
      withMergeStage,
    });
  }

  /**
   * Gets a builder for the provided entity type.
   *
   * @param {string} entityType
   */
  get(entityType) {
    const builder = this.builders.get(entityType);
    if (!builder) throw new Error(`No builder exists for entity type '${entityType}'`);
    return builder;
  }
}
