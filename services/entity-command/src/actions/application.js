import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { applicationProps } from '@parameter1/sso-mongodb-command';
import { commands } from '../mongodb.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .CreateApplicationSchema} CreateApplicationSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .ChangeApplicationNameSchema} ChangeApplicationNameSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .EventStoreResult} {EventStoreResult}
 */
export default {
  /**
   * @typedef ChangeApplicationNameActionParams
   * @property {ChangeApplicationNameSchema|ChangeApplicationNameSchema[]} input
   *
   * @param {ChangeApplicationNameActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeApplicationNameActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: applicationProps.id.required(),
        name: applicationProps.name.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('application.create'), params);

    return covertActionError(() => commands
      .get('application')
      .changeName({ input }));
  },

  /**
   * @typedef CreateApplicationActionParams
   * @property {CreateApplicationSchema|CreateApplicationSchema[]} input
   *
   * @param {CreateApplicationActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateApplicationActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: applicationProps.id,
        userId: eventProps.userId,
        values: object({
          name: applicationProps.name.required(),
          key: applicationProps.key.required(),
          roles: applicationProps.roles,
        }).required(),
      }).required()).required(),
    }).required().label('application.create'), params);

    return covertActionError(() => commands
      .get('application')
      .create({ input }));
  },
};
