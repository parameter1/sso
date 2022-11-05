import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { ObjectId } from '@parameter1/sso-mongodb-core';

import { applicationProps } from './props.js';

const { object } = PropTypes;

/**
 * @typedef ChangeApplicationName
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {string} name
 * @property {ObjectId} [userId]
 */
export const changeApplicationName = object({
  date: eventProps.date,
  entityId: applicationProps.id.required(),
  name: applicationProps.name.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef CreateApplication
 * @property {Date|string} [date]
 * @property {ObjectId} [entityId]
 * @property {CreateApplicationValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateApplicationValues
 * @property {string} name
 * @property {string} key
 * @property {string[]} [roles=[Administrator, Member]]
 */
export const createApplication = object({
  date: eventProps.date,
  entityId: applicationProps.id.default(() => new ObjectId()),
  userId: eventProps.userId,
  values: object({
    name: applicationProps.name.required(),
    key: applicationProps.key.required(),
    roles: applicationProps.roles.default(['Administrator', 'Member']),
  }).required(),
}).required();
