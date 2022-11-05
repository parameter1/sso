import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { userProps } from '@parameter1/sso-mongodb-command';
import { commands } from '../mongodb.js';

const handler = commands.get('user');

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .ChangeUserEmailSchema} ChangeUserEmailSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .ChangeUserNameSchema} ChangeUserNameSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .CreateUserSchema} CreateUserSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .DeleteUserSchema} DeleteUserSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .EventStoreResult} {EventStoreResult}
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .RestoreUserSchema} RestoreUserSchema
 */
export default {
  /**
   * @typedef ChangeUserEmailActionParams
   * @property {ChangeUserEmailSchema|ChangeUserEmailSchema[]} input
   *
   * @param {ChangeUserEmailActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeEmail(params) {
    /** @type {ChangeUserEmailActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id.required(),
        email: userProps.email.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('user.changeEmail'), params);

    return covertActionError(() => handler.changeEmail({ input }));
  },

  /**
   * @typedef ChangeUserNameActionParams
   * @property {ChangeUserNameSchema|ChangeUserNameSchema[]} input
   *
   * @param {ChangeUserNameActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeUserNameActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id.required(),
        familyName: userProps.familyName.required(),
        givenName: userProps.givenName.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('user.changeName'), params);

    return covertActionError(() => handler.changeName({ input }));
  },

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

    return covertActionError(() => handler.create({ input }));
  },

  /**
   * @typedef DeleteUserActionParams
   * @property {DeleteUserSchema|DeleteUserSchema[]} input
   *
   * @param {DeleteUserActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async delete(params) {
    /** @type {DeleteUserActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('user.delete'), params);

    return covertActionError(() => handler.delete({ input }));
  },

  /**
   * @typedef RestoreUserActionParams
   * @property {RestoreUserSchema|RestoreUserSchema[]} input
   *
   * @param {RestoreUserActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async restore(params) {
    /** @type {RestoreUserActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        email: userProps.email.required(),
        entityId: userProps.id.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('user.restore'), params);

    return covertActionError(() => handler.restore({ input }));
  },
};