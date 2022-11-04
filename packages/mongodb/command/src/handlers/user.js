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
 * @typedef {import("../types").CreateUserSchema} CreateUserSchema
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
}
