import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { sluggify } from '@parameter1/slug';

import { CommandHandler } from './-root.js';
import { applicationProps } from '../props/application.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("../types").ChangeApplicationNameSchema} ChangeApplicationNameSchema
 * @typedef {import("../types").CreateApplicationSchema} CreateApplicationSchema
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class ApplicationCommandHandler extends CommandHandler {
  /**
   *
   * @param {import("./-root").CommandHandlerConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'application' });
  }

  /**
   * @typedef ChangeApplicationNameCommandParams
   * @property {ChangeApplicationNameSchema|ChangeApplicationNameSchema[]} input
   *
   * @param {ChangeApplicationNameCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeApplicationNameCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: applicationProps.id.required(),
        name: applicationProps.name.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('application.changeName'), params);

    return this.executeUpdate({
      input: input.map(({ name, ...rest }) => ({
        ...rest,
        command: 'CHANGE_NAME',
        values: { name, slug: sluggify(name) },
      })),
    });
  }

  /**
   * @typedef CreateApplicationCommandParams
   * @property {CreateApplicationSchema|CreateApplicationSchema[]} input
   *
   * @param {CreateApplicationCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateApplicationCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: applicationProps.id.default(() => this.generateId()),
        userId: eventProps.userId,
        values: object({
          name: applicationProps.name.required(),
          key: applicationProps.key.required(),
          roles: applicationProps.roles.default(['Administrator', 'Member']),
        }).required(),
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
