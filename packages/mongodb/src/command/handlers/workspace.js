import { runTransaction } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import { BaseCommandHandler } from './-base.js';
import { eventProps } from '../event-store.js';
import applicationProps from '../props/application.js';
import organizationProps from '../props/organization.js';
import workspaceProps from '../props/workspace.js';

const { object, oneOrMany } = PropTypes;

const createValuesSchema = object({
  appId: applicationProps.id.required(),
  name: workspaceProps.name.required(),
  orgId: organizationProps.id.required(),
  key: workspaceProps.key.required(),
}).custom((workspace) => ({
  ...workspace,
  slug: sluggify(workspace.name),
})).required();

export class WorkspaceCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {object} params
   */
  constructor(params) {
    super({ ...params, entityType: 'workspace' });
  }

  async changeName(params, { returnResults = false } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: workspaceProps.id.required(),
      date: eventProps.date,
      name: workspaceProps.name.required(),
      userId: eventProps.userId,
    })).required().custom((vals) => vals.map((o) => ({
      command: 'CHANGE_NAME',
      entityId: o.entityId,
      date: o.date,
      values: { name: o.name, slug: sluggify(o.name) },
      userId: o.userId,
    }))), params);
    return this.executeUpdate(commands, { returnResults });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async create(params, { returnResults, session: currentSession } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: workspaceProps.id,
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);

    return runTransaction(async ({ session }) => {
      const results = await this.executeCreate(commands, { returnResults, session });
      const reservations = results.map((result) => ({
        entityId: result._id,
        key: 'app_org_key',
        value: `${result.values.appId}_${result.values.orgId}_${result.values.key}`,
      }));
      await this.reserve(reservations, { session });
      return results;
    }, { currentSession, client: this.client });
  }
}
