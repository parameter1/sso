import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { sluggify } from '@parameter1/slug';
import { BaseCommandHandler } from './-base.js';
import applicationProps from '../props/application.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-core").ObjectId} ObjectId
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
   * @typedef CreateApplicationCommandInputValues
   * @property {string} name
   * @property {string} key
   * @property {string[]} [roles=[Administrator, Member]]
   *
   * @typedef CreateApplicationCommandInput
   * @property {ObjectId} [entityId]
   * @property {Date|string} [date]
   * @property {CreateApplicationCommandInputValues} values
   * @property {ObjectId} [userId]
   *
   * @typedef CreateApplicationCommandParams
   * @property {CreateApplicationCommandInput|CreateApplicationCommandInput[]} input
   *
   * @param {CreateApplicationCommandParams} params
   */
  async create(params) {
    /** @type {CreateApplicationCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        entityId: this.entityIdPropType,
        date: eventProps.date,
        values: object({
          name: applicationProps.name.required(),
          key: applicationProps.key.required(),
          roles: applicationProps.roles.default(['Administrator', 'Member']),
        }).required().custom((application) => ({
          ...application,
          slug: sluggify(application.name),
        })),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('application.create'), params);

    const session = await this.store.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        results = await this.executeCreate({
          input,
          session: activeSession,
        });

        await this.reserve({
          input: results.map((result) => ({
            entityId: result._id,
            key: 'key',
            value: result.values.key,
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
