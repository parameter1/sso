import { runTransaction } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { sluggify } from '@parameter1/slug';

import { BaseCommandHandler } from './-base.js';
import { eventProps } from '../event-store.js';
import userProps from '../props/user.js';

const { object, oneOrMany } = PropTypes;

export const sluggifyUserNames = (names, reverse = false) => {
  const values = reverse ? [...names].reverse() : names;
  return sluggify(values.join(' '));
};

const createValuesSchema = object({
  email: userProps.email.required(),
  familyName: userProps.familyName.required(),
  givenName: userProps.givenName.required(),
  verified: userProps.verified.default(false),
}).custom((user) => {
  const names = [user.givenName, user.familyName];
  return {
    ...user,
    domain: user.email.split('@')[1],
    slug: {
      default: sluggifyUserNames(names),
      reverse: sluggifyUserNames(names, true),
    },
  };
}).required();

export class UserCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {object} params
   */
  constructor(params) {
    super({ ...params, entityType: 'user' });
  }

  async changeEmail(params, { returnResults = false } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: userProps.id.required(),
      date: eventProps.date,
      email: userProps.email.required(),
      userId: eventProps.userId,
    })).required().custom((vals) => vals.map((o) => ({
      command: 'CHANGE_EMAIL',
      entityId: o.entityId,
      date: o.date,
      values: {
        domain: o.email.split('@')[1],
        email: o.email,
      },
      userId: o.userId,
    }))), params);

    return runTransaction(async ({ session }) => {
      const { release, reserve } = commands.reduce((o, { entityId, values }) => {
        o.release.push({ entityId, key: 'email' });
        o.reserve.push({ entityId, key: 'email', value: values.email });
        return o;
      }, { release: [], reserve: [] });
      await this.release(release, { session });
      await this.reserve(reserve, { session });
      const results = await this.executeUpdate(commands, { returnResults, session });
      return results;
    }, { client: this.client });
  }

  async changeName(params, { returnResults = false } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: userProps.id.required(),
      date: eventProps.date,
      givenName: userProps.givenName.required(),
      familyName: userProps.familyName.required(),
      userId: eventProps.userId,
    })).required().custom((vals) => vals.map((o) => {
      const { givenName, familyName } = o;
      const names = [givenName, familyName];
      return {
        command: 'CHANGE_NAME',
        entityId: o.entityId,
        date: o.date,
        values: {
          givenName,
          familyName,
          slug: {
            default: sluggifyUserNames(names),
            reverse: sluggifyUserNames(names, true),
          },
        },
        userId: o.userId,
      };
    })), params);
    return this.executeUpdate(commands, { returnResults });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async create(params, { returnResults = false, session: currentSession } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: userProps.id,
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);

    return runTransaction(async ({ session }) => {
      const results = await this.executeCreate(commands, { returnResults, session });
      const reservations = results.map((result) => ({
        entityId: result.entityId,
        key: 'email',
        value: result.values.email,
      }));
      await this.reserve(reservations, { session });
      return results;
    }, { currentSession, client: this.client });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async delete(params, { returnResults = false, session: currentSession } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: userProps.id.required(),
      date: eventProps.date,
      userId: eventProps.userId,
    })).required(), params);

    return runTransaction(async ({ session }) => {
      await this.release(commands.map(({ entityId }) => ({
        entityId,
        key: 'email',
      })), { session });
      const results = await this.executeDelete(commands, { returnResults, session });
      return results;
    }, { currentSession, client: this.client });
  }

  async magicLogin(params, { returnResults = false } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: userProps.id.required(),
    })).required().custom((vals) => vals.map(({ entityId }) => ({
      command: 'MAGIC_LOGIN',
      entityId,
      omitFromHistory: true,
      omitFromModified: true,
    }))), params);
    return this.executeUpdate(commands, { returnResults });
  }

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async restore(params, { returnResults = false, session: currentSession } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: userProps.id.required(),
      date: eventProps.date,
      email: userProps.email.required(),
      userId: eventProps.userId,
    })).required().custom((vals) => vals.map((o) => ({
      entityId: o.entityId,
      date: o.date,
      values: {
        domain: o.email.split('@')[1],
        email: o.email,
      },
      userId: o.userId,
    }))), params);

    return runTransaction(async ({ session }) => {
      await this.reserve(commands.map(({ entityId, values }) => ({
        entityId,
        key: 'email',
        value: values.email,
      })), { session });
      const results = await this.executeRestore(commands, { returnResults, session });
      return results;
    }, { currentSession, client: this.client });
  }
}
