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
   * @todo Handle email reservation?
   * @param {object} params
   */
  async create(params) {
    const commands = await validateAsync(oneOrMany(object({
      entityId: eventProps.entityId,
      date: eventProps.date,
      values: createValuesSchema,
      userId: eventProps.userId,
    })).required(), params);
    return this.executeCreate(commands);
  }
}
