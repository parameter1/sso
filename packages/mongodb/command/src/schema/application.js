import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';

import applicationProps from '../props/application.js';

const { object } = PropTypes;

/**
 * @typedef CreateApplicationSchemaValues
 * @property {string} name
 * @property {string} key
 * @property {string[]} [roles=[Administrator, Member]]
 *
 * @typedef CreateApplicationSchema
 * @property {ObjectId} [entityId]
 * @property {Date|string} [date]
 * @property {CreateApplicationSchemaValues} values
 * @property {ObjectId} [userId]
 */
export const createApplicationSchema = object({
  entityId: applicationProps.id,
  date: eventProps.date,
  values: object({
    name: applicationProps.name.required(),
    key: applicationProps.key.required(),
    roles: applicationProps.roles.default(['Administrator', 'Member']),
  }).required(),
  userId: eventProps.userId,
});
