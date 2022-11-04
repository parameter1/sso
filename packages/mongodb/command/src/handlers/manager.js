import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';

import { CommandHandler } from './-root.js';
import { managerProps } from '../props/manager.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("../types").CreateManagerSchema} CreateManagerSchema
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class ManagerCommandHandler extends CommandHandler {
  /**
   *
   * @param {import("./-root").CommandHandlerConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'manager' });
  }

  /**
   * @typedef CreateManagerCommandParams
   * @property {CreateManagerSchema|CreateManagerSchema[]} input
   *
   * @param {CreateManagerCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateManagerCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: managerProps.id.required(),
        userId: eventProps.userId,
        values: object({
          role: managerProps.role.required(),
        }).required(),
      }).required()).required(),
    }).required().label('manager.create'), params);

    return this.executeCreate({ input });
  }
}
