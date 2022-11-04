import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { userProps } from '@parameter1/sso-mongodb-command';
import { commands } from '../mongodb.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .CreateUserSchema} CreateUserSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .EventStoreResult} {EventStoreResult}
 */
export default {
  /**
   * @typedef CreateUserActionParams
   * @property {CreateUserSchema|CreateUserSchema[]} input
   *
   * @param {CreateUserActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateUserActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id,
        userId: eventProps.userId,
        values: object({
          email: userProps.email.required(),
          familyName: userProps.familyName.required(),
          givenName: userProps.givenName.required(),
          verified: userProps.verified.default(false),
        }).required(),
      }).required()).required(),
    }).required().label('user.create'), params);

    return covertActionError(() => commands
      .get('user')
      .create({ input }));
  },
};
