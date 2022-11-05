import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { ObjectId } from '@parameter1/sso-mongodb-core';
import { applicationProps } from '../props/application.js';

const { object } = PropTypes;

/**
 * @typedef ApplicationChangeNameSchema
 * @property {ObjectId} entityId
 * @property {Date|string} [date]
 * @property {string} name
 * @property {ObjectId} [userId]
 */
export const applicationChangeNameSchema = object({
  date: eventProps.date,
  entityId: applicationProps.id.required(),
  name: applicationProps.name.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef ApplicationCreateSchema
 * @property {ObjectId} [entityId]
 * @property {Date|string} [date]
 * @property {ApplicationCreateSchemaValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef ApplicationCreateSchemaValues
 * @property {string} name
 * @property {string} key
 * @property {string[]} [roles=[Administrator, Member]]
 */
export const applicationCreateSchema = object({
  date: eventProps.date,
  entityId: applicationProps.id.default(() => new ObjectId()),
  userId: eventProps.userId,
  values: object({
    name: applicationProps.name.required(),
    key: applicationProps.key.required(),
    roles: applicationProps.roles.default(['Administrator', 'Member']),
  }).required(),
}).required();
