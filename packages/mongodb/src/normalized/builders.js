import { PropTypes, attempt } from '@parameter1/sso-prop-types';

import { eventProps } from '../command/event-store.js';

import { ApplicationBuilder } from './builders/application.js';
import { ManagerBuilder } from './builders/manager.js';
import { MemberBuilder } from './builders/member.js';
import { OrganizationBuilder } from './builders/organization.js';
import { UserBuilder } from './builders/user.js';
import { WorkspaceBuilder } from './builders/workspace.js';

const { boolean, object, oneOrMany } = PropTypes;

export class NormalizedBuilders {
  /**
   *
   */
  constructor() {
    this.builders = [
      ApplicationBuilder,
      ManagerBuilder,
      MemberBuilder,
      OrganizationBuilder,
      UserBuilder,
      WorkspaceBuilder,
    ].reduce((map, Builder) => {
      const builder = new Builder();
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
    const { entityType, entityIds, withMergeStage } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      entityIds: oneOrMany(eventProps.entityId).required(),
      withMergeStage: boolean().default(true),
    }).required());

    return this.get(entityType).buildPipeline({
      entityIds,
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

  /**
   * Determines if a builder exists for the provided entity type.
   *
   * @param {string} entityType
   */
  has(entityType) {
    return this.builders.has(entityType);
  }

  keys() {
    return [...this.builders.keys()];
  }
}
