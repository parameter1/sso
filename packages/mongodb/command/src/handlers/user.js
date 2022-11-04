import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { sluggify } from '@parameter1/slug';

import { BaseCommandHandler } from './-base.js';
import { userProps } from '../props/user.js';

const { object, oneOrMany } = PropTypes;

export const sluggifyUserNames = (names, reverse = false) => {
  const values = reverse ? [...names].reverse() : names;
  return sluggify(values.join(' '));
};

/**
 * @typedef {import("../types").ChangeUserEmailSchema} ChangeUserEmailSchema
 * @typedef {import("../types").ChangeUserNameSchema} ChangeUserNameSchema
 * @typedef {import("../types").CreateUserSchema} CreateUserSchema
 * @typedef {import("../types").DeleteUserSchema} DeleteUserSchema
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class UserCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {import("./-base").CommandHandlerConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'user' });
  }

  /**
   * @typedef ChangeUserEmailCommandParams
   * @property {ChangeUserEmailSchema|ChangeUserEmailSchema[]} input
   *
   * @param {ChangeUserEmailCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeEmail(params) {
    /** @type {ChangeUserEmailCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id.required(),
        email: userProps.email.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('user.changeEmail'), params);

    const session = await this.store.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // release and reserve first so failures will not trigger a push message
        const { release, reserve } = input.reduce((o, { entityId, email }) => {
          o.release.push({ entityId, key: 'email' });
          o.reserve.push({ entityId, key: 'email', value: email });
          return o;
        }, { release: [], reserve: [] });
        await this.release({ input: release, session: activeSession });
        await this.reserve({ input: reserve, session: activeSession });

        results = await this.executeUpdate({
          input: input.map(({ email, ...rest }) => ({
            ...rest,
            command: 'CHANGE_EMAIL',
            values: { domain: email.split('@')[1], email },
          })),
          session: activeSession,
        });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }

  /**
   * @typedef ChangeUserNameCommandParams
   * @property {ChangeUserNameSchema|ChangeUserNameSchema[]} input
   *
   * @param {ChangeUserNameCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeUserNameCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id.required(),
        familyName: userProps.familyName.required(),
        givenName: userProps.givenName.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('user.changeName'), params);

    return this.executeUpdate({
      input: input.map(({ familyName, givenName, ...rest }) => {
        const names = [givenName, familyName];
        return {
          ...rest,
          command: 'CHANGE_NAME',
          values: {
            familyName,
            givenName,
            slug: {
              default: sluggifyUserNames(names),
              reverse: sluggifyUserNames(names, true),
            },
          },
        };
      }),
    });
  }

  /**
   * @typedef CreateUserCommandParams
   * @property {CreateUserSchema|CreateUserSchema[]} input
   *
   * @param {CreateUserCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateUserCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id.default(() => this.generateId()),
        userId: eventProps.userId,
        values: object({
          email: userProps.email.required(),
          familyName: userProps.familyName.required(),
          givenName: userProps.givenName.required(),
          verified: userProps.verified.default(false),
        }).required(),
      }).required()).required(),
    }).required().label('user.create'), params);

    const session = await this.store.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            key: 'email',
            value: o.values.email,
          })),
          session,
        });

        results = await this.executeCreate({
          input: input.map(({ values, ...rest }) => {
            const names = [values.givenName, values.familyName];
            return {
              ...rest,
              values: {
                ...values,
                domain: values.email.split('@')[1],
                slug: {
                  default: sluggifyUserNames(names),
                  reverse: sluggifyUserNames(names, true),
                },
              },
            };
          }),
          session: activeSession,
        });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }

  /**
   * @typedef DeleteUserCommandParams
   * @property {DeleteUserSchema|DeleteUserSchema[]} input
   *
   * @param {DeleteUserCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async delete(params) {
    /** @type {DeleteUserCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: userProps.id.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('user.delete'), params);

    const session = await this.store.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // release first so failures will not trigger a push message
        await this.release({
          input: input.map(({ entityId }) => ({ entityId, key: 'email' })),
          session: activeSession,
        });
        results = await this.executeDelete({ input, session });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }
}
