import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { mongoSessionProp } from '@parameter1/sso-mongodb-core';
import { sluggify } from '@parameter1/slug';

import {
  changeUserEmail,
  changeUserName,
  createUser,
  deleteUser,
  magicUserLogin,
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
   * @property {EventStore} store
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { store } = attempt(params, object({
      store: object().instance(EventStore).required(),
    }).required());
    this.entityType = 'user';
    /** @type {EventStore} */
    this.store = store;
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

    const session = this.store.startSession();
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
        await this.store.release({ input: release, session: activeSession });
        await this.store.reserve({ input: reserve, session: activeSession });

        results = await this.store.executeUpdate({
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

    return this.store.executeUpdate({
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

    const session = this.store.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.store.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            entityType: this.entityType,
            key: 'email',
            value: o.values.email,
          })),
          session: activeSession,
        });

        results = await this.store.executeCreate({
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

    const session = this.store.startSession();
    try {
      let results;
      const { entityType } = this;
      await session.withTransaction(async (activeSession) => {
        // release first so failures will not trigger a push message
        await this.store.release({
          input: input.map(({ entityId }) => ({ entityId, entityType, key: 'email' })),
          session: activeSession,
        });
        results = await this.store.executeDelete({ entityType, input, session });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }

  /**
   * @typedef {import("./schema").MagicUserLogin} MagicUserLogin
   *
   * @typedef MagicLoginParams
   * @prop {MagicUserLogin[]} input
   * @prop {import("@parameter1/sso-mongodb-core").ClientSession} session
   *
   * @param {MagicLoginParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async magicLogin(params) {
    /** @type {MagicLoginParams}  */
    const { input, session } = await validateAsync(object({
      input: array().items(magicUserLogin).required(),
      session: mongoSessionProp,
    }).required().label('user.magicLogin'), params);

    return this.store.executeUpdate({
      entityType: this.entityType,
      input: input.map(({ entityId }) => ({
        command: 'MAGIC_LOGIN',
        entityId,
        omitFromHistory: true,
        omitFromModified: true,
      })),
      session,
    });
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

    const session = this.store.startSession();
    try {
      let results;
      const { entityType } = this;
      await session.withTransaction(async (activeSession) => {
        // reserve first so failures will not trigger a push message
        await this.store.reserve({
          input: input.map(({ entityId, email }) => ({
            entityId,
            entityType,
            key: 'email',
            value: email,
          })),
          session: activeSession,
        });
        results = await this.store.executeRestore({
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
