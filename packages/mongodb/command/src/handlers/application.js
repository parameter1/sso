import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { sluggify } from '@parameter1/slug';
import { BaseCommandHandler } from './-base.js';
import { createApplicationSchema } from '../schema/application.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-core").ObjectId} ObjectId
 * @typedef {import("../schema/application").CreateApplicationSchema} CreateApplicationSchema
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
      input: oneOrMany(createApplicationSchema.required()).required(),
    }).required().label('application.create'), params);

    const session = await this.store.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        results = await this.executeCreate({
          input: input.map(({ values, ...rest }) => ({
            ...rest,
            values: { ...values, slug: sluggify(values.name) },
          })),
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
