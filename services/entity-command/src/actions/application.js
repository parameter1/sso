import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { createApplicationSchema } from '@parameter1/sso-mongodb-command';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { commands } from '../mongodb.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .CreateApplicationSchema} CreateApplicationSchema
 */
export default {
  /**
   * @typedef CreateApplicationActionParams
   * @property {CreateApplicationSchema|CreateApplicationSchema[]} input
   *
   * @param {CreateApplicationActionParams} params
   */
  async create(params) {
    /** @type {CreateApplicationActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(createApplicationSchema.required()).required(),
    }).required().label('application.create'), params);

    return covertActionError(() => commands
      .get('application')
      .create({ input }));
  },
};
