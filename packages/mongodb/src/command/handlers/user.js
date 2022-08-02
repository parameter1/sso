import { runTransaction } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@parameter1/prop-types';
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

  /**
   *
   * @param {object} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   */
  async create(params, { session: currentSession } = {}) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: eventProps.entityId,
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);

    return runTransaction(async ({ session }) => {
      const results = await this.executeCreate(commands, { session });
      const reservations = results.map((result) => ({
        entityId: result._id,
        key: 'email',
        value: result.values.email,
      }));
      await this.reserve(reservations, { session });
      return results;
    }, { currentSession, client: this.client });
  }
}
