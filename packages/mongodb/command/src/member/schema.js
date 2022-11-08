import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';

import { memberProps } from './props.js';

const { object } = PropTypes;

/**
 * @typedef ChangeMemberRole
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {string} role
 * @property {ObjectId} [userId]
 */
export const changeMemberRole = object({
  date: eventProps.date,
  entityId: memberProps.id.required(),
  role: memberProps.role.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef CreateMember
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {CreateMemberValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateMemberValues
 * @property {string} role
 */
export const createMember = object({
  date: eventProps.date,
  entityId: memberProps.id.required(),
  userId: eventProps.userId,
  values: object({
    role: memberProps.role.required(),
  }).required(),
}).required();

/**
 * @typedef CreateOrRestoreMember
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {CreateOrRestoreMemberValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateOrRestoreMemberValues
 * @property {string} role
 */
export const createOrRestoreMember = object({
  date: eventProps.date,
  entityId: memberProps.id.required(),
  userId: eventProps.userId,
  values: object({
    role: memberProps.role.required(),
  }).required(),
}).required();

/**
 * @typedef DeleteMember
 * @property {ObjectId} entityId
 * @property {Date|string} [date]
 * @property {ObjectId} [userId]
 */
export const deleteMember = object({
  date: eventProps.date,
  entityId: memberProps.id.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef RestoreMember
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {RestoreMemberValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef RestoreMemberValues
 * @property {string} role
 */
export const restoreMember = object({
  date: eventProps.date,
  entityId: memberProps.id.required(),
  userId: eventProps.userId,
  values: object({
    role: memberProps.role.required(),
  }).required(),
}).required();
