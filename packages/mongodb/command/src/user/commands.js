import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { sluggify } from '@parameter1/slug';
import { CommandHandler } from '../handler.js';

import {
  changeUserEmail,
  changeUserName,
  createUser,
  deleteUser,
  restoreUser,
} from './schema.js';

const sluggifyUserNames = (names, reverse = false) => {
  const values = reverse ? [...names].reverse() : names;
  return sluggify(values.join(' '));
};

const emailValues = (email) => ({
  domain: email.split('@')[1],
  email,
});

const { array, object } = PropTypes;

/**
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class UserCommands {
  /**
   * @typedef ConstructorParams
   * @property {CommandHandler} handler
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { handler } = attempt(params, object({
      handler: object().instance(CommandHandler).required(),
    }).required());
    this.entityType = 'user';
    /** @type {CommandHandler} */
    this.handler = handler;
  }

  /**
   * @typedef {import("./schema").ChangeUserEmail} ChangeUserEmail
   *
   * @typedef ChangeEmailParams
   * @property {ChangeUserEmail[]} input
   *
   * @param {ChangeEmailParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeEmail(params) {
    /** @type {ChangeEmailParams}  */
    const { input } = await validateAsync(object({
      input: array().items(changeUserEmail).required(),
    }).required().label('user.changeEmail'), params);

    const session = this.handler.startSession();
    try {
      let results;
      const { entityType } = this;
      await session.withTransaction(async (activeSession) => {
        // release and reserve first so failures will not trigger a push message
        const { release, reserve } = input.reduce((o, { entityId, email }) => {
          o.release.push({ entityId, entityType, key: 'email' });
          o.reserve.push({
            entityId,
            entityType,
            key: 'email',
            value: email,
          });
          return o;
        }, { release: [], reserve: [] });
        await this.handler.release({ input: release, session: activeSession });
        await this.handler.reserve({ input: reserve, session: activeSession });

        results = await this.handler.executeUpdate({
          entityType,
          input: input.map(({ email, ...rest }) => ({
            ...rest,
            command: 'CHANGE_EMAIL',
            values: emailValues(email),
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
   * @typedef {import("./schema").ChangeUserName} ChangeUserName
   *
   * @typedef ChangeNameParams
   * @property {ChangeUserName[]} input
   *
   * @param {ChangeNameParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeNameParams}  */
    const { input } = await validateAsync(object({
      input: array().items(changeUserName).required(),
    }).required().label('user.changeName'), params);

    return this.handler.executeUpdate({
      entityType: this.entityType,
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
   * @typedef {import("./schema").CreateUser} CreateUser
   *
   * @typedef CreateParams
   * @property {CreateUser[]} input
   *
   * @param {CreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateParams}  */
    const { input } = await validateAsync(object({
      input: array().items(createUser).required(),
    }).required().label('user.create'), params);

    const session = this.handler.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.handler.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            entityType: this.entityType,
            key: 'email',
            value: o.values.email,
          })),
          session,
        });

        results = await this.handler.executeCreate({
          entityType: this.entityType,
          input: input.map(({ values, ...rest }) => {
            const names = [values.givenName, values.familyName];
            return {
              ...rest,
              values: {
                ...values,
                ...emailValues(values.email),
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
   * @typedef {import("./schema").DeleteUser} DeleteUser
   *
   * @typedef DeleteParams
   * @property {DeleteUser[]} input
   *
   * @param {DeleteParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async delete(params) {
    /** @type {DeleteParams}  */
    const { input } = await validateAsync(object({
      input: array().items(deleteUser).required(),
    }).required().label('user.delete'), params);

    const session = this.handler.startSession();
    try {
      let results;
      const { entityType } = this;
      await session.withTransaction(async (activeSession) => {
        // release first so failures will not trigger a push message
        await this.handler.release({
          input: input.map(({ entityId }) => ({ entityId, entityType, key: 'email' })),
          session: activeSession,
        });
        results = await this.handler.executeDelete({ entityType, input, session });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }

  /**
   * @typedef {import("./schema").RestoreUser} RestoreUser
   *
   * @typedef RestoreParams
   * @property {RestoreUser[]} input
   *
   * @param {RestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async restore(params) {
    /** @type {RestoreParams}  */
    const { input } = await validateAsync(object({
      input: array().items(restoreUser).required(),
    }).required().label('user.restore'), params);

    const session = this.handler.startSession();
    try {
      let results;
      const { entityType } = this;
      await session.withTransaction(async (activeSession) => {
        // reserve first so failures will not trigger a push message
        await this.handler.reserve({
          input: input.map(({ entityId, email }) => ({
            entityId,
            entityType,
            key: 'email',
            value: email,
          })),
          session: activeSession,
        });
        results = await this.handler.executeRestore({
          entityType,
          input: input.map(({ email, ...rest }) => ({
            ...rest,
            values: emailValues(email),
          })),
          session,
        });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }
}
