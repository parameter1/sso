import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { sluggify } from '@parameter1/slug';

import { BaseCommandHandler } from './-base.js';
import { applicationProps } from '../props/application.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("../types").CreateApplicationSchema} CreateApplicationSchema
 *
 */
export class ApplicationCommandHandler extends BaseCommandHandler {
  /**
   *
   * @param {import("./-base").CommandHandlerConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'application' });
  }

  /**
   * @typedef CreateApplicationCommandParams
   * @property {CreateApplicationSchema|CreateApplicationSchema[]} input
   *
   * @param {CreateApplicationCommandParams} params
   */
  async create(params) {
    /** @type {CreateApplicationCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: applicationProps.id.default(() => this.generateId()),
        date: eventProps.date,
        values: object({
          name: applicationProps.name.required(),
          key: applicationProps.key.required(),
          roles: applicationProps.roles.default(['Administrator', 'Member']),
        }).required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('application.create'), params);

    const session = await this.store.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            key: 'key',
            value: o.values.key,
          })),
          session,
        });

        results = await this.executeCreate({
          input: input.map(({ values, ...rest }) => ({
            ...rest,
            values: { ...values, slug: sluggify(values.name) },
          })),
          session: activeSession,
        });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }
}
