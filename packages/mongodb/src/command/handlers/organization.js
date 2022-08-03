import { runTransaction } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import { BaseCommandHandler } from './-base.js';
import { eventProps } from '../event-store.js';
import organizationProps from '../props/organization.js';

const { object, oneOrMany } = PropTypes;

const createValuesSchema = object({
  name: organizationProps.name.required(),
  key: organizationProps.key.required(),
  emailDomains: organizationProps.emailDomains.default([]),
}).custom((organization) => ({
  ...organization,
  slug: sluggify(organization.name),
})).required();

export class OrganizationCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {object} params
   */
  constructor(params) {
    super({ ...params, entityType: 'organization' });
  }

  async changeName(params) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: eventProps.entityId.required(),
      date: eventProps.date,
      name: organizationProps.name.required(),
      userId: eventProps.userId,
    })).required().custom((vals) => vals.map((o) => ({
      command: 'CHANGE_NAME',
      entityId: o.entityId,
      date: o.date,
      values: { name: o.name, slug: sluggify(o.name) },
      userId: o.userId,
    }))), params);
    return this.executeUpdate(commands);
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async create(params, { session: currentSession } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: eventProps.entityId,
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);

    return runTransaction(async ({ session }) => {
      const results = await this.executeCreate(commands, { session });
      const reservations = results.map((result) => ({
        entityId: result._id,
        key: 'key',
        value: result.values.key,
      }));
      await this.reserve(reservations, { session });
      return results;
    }, { currentSession, client: this.client });
  }
}
