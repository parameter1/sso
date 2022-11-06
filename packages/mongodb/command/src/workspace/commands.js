import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { sluggify } from '@parameter1/slug';
import { CommandHandler } from '../handler.js';

import { createWorkspace } from './schema.js';

const { array, object } = PropTypes;

/**
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class WorkspaceCommands {
  /**
   * @typedef ConstructorParams
   * @property {CommandHandler} handler
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { handler } = attempt(params, object({
      handler: object().instance(CommandHandler).required(),
    }).required());
    this.entityType = 'workspace';
    /** @type {CommandHandler} */
    this.handler = handler;
  }

  /**
   * @typedef {import("./schema").CreateWorkspace} CreateWorkspace
   *
   * @typedef CreateParams
   * @property {CreateWorkspace[]} input
   *
   * @param {CreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateParams}  */
    const { input } = await validateAsync(object({
      input: array().items(createWorkspace).required(),
    }).required().label('workspace.create'), params);

    const session = this.handler.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.handler.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            entityType: this.entityType,
            key: 'app_org_key',
            value: `${o.values.appId}_${o.values.orgId}_${o.values.key}`,
          })),
          session,
        });

        results = await this.handler.executeCreate({
          entityType: this.entityType,
          input: input.map(({ values, ...rest }) => ({
            ...rest,
            values: { ...values, slug: sluggify(values.name) },
          })),
          session: activeSession,
        });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }
}
