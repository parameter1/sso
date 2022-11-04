import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { applicationProps } from '@parameter1/sso-mongodb-command';
import { commands } from '../mongodb.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .CreateApplicationSchema} CreateApplicationSchema
 */
export default {
  /**
   * @typedef CreateApplicationActionParams
   * @property {CreateApplicationSchema|CreateApplicationSchema[]} input
   *
   * @param {CreateApplicationActionParams} params
   */
  async create(params) {
    /** @type {CreateApplicationActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: applicationProps.id,
        date: eventProps.date,
        values: object({
          name: applicationProps.name.required(),
          key: applicationProps.key.required(),
          roles: applicationProps.roles,
        }).required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('application.create'), params);

    return covertActionError(() => commands
      .get('application')
      .create({ input }));
  },
};
