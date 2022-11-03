import { PropTypes, validateAsync } from '@parameter1/sso-prop-types';

import { BaseCommandHandler } from './-base.js';
import { eventProps } from '../event-store.js';
import memberProps from '../props/member.js';

const { object, oneOrMany } = PropTypes;

const createValuesSchema = object({
  role: memberProps.role.required(),
});

export class MemberCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {object} params
   */
  constructor(params) {
    super({ ...params, entityType: 'member' });
  }

  /**
   *
   * @param {object} params
   */
  async changeRole(params, { returnResults = false } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: memberProps.id.required(),
      date: eventProps.date,
      role: memberProps.role.required(),
      userId: eventProps.userId,
    })).required().custom((vals) => vals.map((o) => ({
      command: 'CHANGE_ROLE',
      entityId: o.entityId,
      date: o.date,
      values: { role: o.role },
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
  async create(params, { returnResults = false, session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: memberProps.id.required(),
      date: eventProps.date,
      values: createValuesSchema.required(),
      userId: eventProps.userId,
    })).required(), params);
    return this.executeCreate(commands, { returnResults, session });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async createOrRestore(params, { returnResults = false, session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: memberProps.id.required(),
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);
    try {
      const result = await this.create(commands, { session });
      return result;
    } catch (e) {
      if (e.code !== 11000) throw e;
      return this.restore(commands, { returnResults, session });
    }
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async delete(params, { returnResults = false, session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: memberProps.id.required(),
      date: eventProps.date,
      userId: eventProps.userId,
    })).required(), params);
    return this.executeDelete(commands, { returnResults, session });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async restore(params, { returnResults = false, session } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: memberProps.id.required(),
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);
    return this.executeRestore(commands, { returnResults, session });
  }
}
