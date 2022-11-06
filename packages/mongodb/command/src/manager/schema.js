import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';

import { managerProps } from './props.js';

const { object } = PropTypes;

/**
 * @typedef CreateManager
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {CreateManagerValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateManagerValues
 * @property {string} role
 */
export const createManager = object({
  date: eventProps.date,
  entityId: managerProps.id.required(),
  userId: eventProps.userId,
  values: object({
    role: managerProps.role.required(),
  }).required(),
}).required();

/**
 * @typedef CreateOrRestoreManager
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {CreateOrRestoreManagerValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateOrRestoreManagerValues
 * @property {string} role
 */
export const createOrRestoreManager = object({
  date: eventProps.date,
  entityId: managerProps.id.required(),
  userId: eventProps.userId,
  values: object({
    role: managerProps.role.required(),
  }).required(),
}).required();

/**
 * @typedef RestoreManager
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {RestoreManagerValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef RestoreManagerValues
 * @property {string} role
 */
export const restoreManager = object({
  date: eventProps.date,
  entityId: managerProps.id.required(),
  userId: eventProps.userId,
  values: object({
    role: managerProps.role.required(),
  }).required(),
}).required();
