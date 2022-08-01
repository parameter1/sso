import { PropTypes, validateAsync } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import { BaseCommandHandler } from './-base.js';
import { eventProps } from '../event-store.js';
import applicationProps from '../props/application.js';

const { object, oneOrMany } = PropTypes;

const createValuesSchema = object({
  name: applicationProps.name.required(),
  key: applicationProps.key.required(),
  roles: applicationProps.roles.default(['Administrator', 'Member']),
}).custom((application) => ({
  ...application,
  slug: sluggify(application.name),
})).required();

export class ApplicationCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {object} params
   * @param {EventStore} params.store
   */
  constructor({ store }) {
    super({ store, entityType: 'application' });
  }

  async changeName(params) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: eventProps.entityId.required(),
      date: eventProps.date,
      name: applicationProps.name.required(),
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
   * @todo Handle application key reservation?
   * @param {object} params
   */
  async create(params) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: eventProps.entityId,
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);
    return this.executeCreate(commands);
  }
}
