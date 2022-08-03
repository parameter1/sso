import { PropTypes, validateAsync } from '@parameter1/prop-types';

import { BaseCommandHandler } from './-base.js';
import { eventProps } from '../event-store.js';
import managerProps from '../props/manager.js';

const { object, oneOrMany } = PropTypes;

const createValuesSchema = object({
  role: managerProps.role.required(),
});

export class ManagerCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {object} params
   */
  constructor(params) {
    super({ ...params, entityType: 'manager' });
  }

  /**
   *
   * @param {object} params
   */
  async changeRole(params) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: managerProps.id.required(),
      date: eventProps.date,
      role: managerProps.role.required(),
      userId: eventProps.userId,
    })).required().custom((vals) => vals.map((o) => ({
      command: 'CHANGE_ROLE',
      entityId: o.entityId,
      date: o.date,
      values: { role: o.role },
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
  async create(params, { session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: managerProps.id.required(),
      date: eventProps.date,
      values: createValuesSchema.required(),
      userId: eventProps.userId,
    })).required(), params);
    return this.executeCreate(commands, { session });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async createOrRestore(params, { session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: managerProps.id.required(),
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);
    try {
      const result = await this.create(commands, { session });
      return result;
    } catch (e) {
      if (e.code !== 11000) throw e;
      return this.restore(commands, { session });
    }
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async delete(params, { session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: managerProps.id.required(),
      date: eventProps.date,
      userId: eventProps.userId,
    })).required(), params);
    return this.executeDelete(commands, { session });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async restore(params, { session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: managerProps.id.required(),
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);
    return this.executeRestore(commands, { session });
  }
}
