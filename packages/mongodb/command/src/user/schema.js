import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { ObjectId } from '@parameter1/sso-mongodb-core';

import { userProps } from './props.js';

const { object } = PropTypes;

/**
 * @typedef ChangeUserEmail
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {string} email
 * @property {ObjectId} [userId]
 */
export const changeUserEmail = object({
  date: eventProps.date,
  entityId: userProps.id.required(),
  email: userProps.email.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef ChangeUserName
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {string} familyName
 * @property {string} givenName
 * @property {ObjectId} [userId]
 */
export const changeUserName = object({
  date: eventProps.date,
  entityId: userProps.id.required(),
  familyName: userProps.familyName.required(),
  givenName: userProps.givenName.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef CreateUser
 * @property {Date|string} [date]
 * @property {ObjectId} [entityId]
 * @property {CreateUserValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateUserValues
 * @property {string} email
 * @property {string} familyName
 * @property {string} givenName
 * @property {boolean} [verified=false]
 */
export const createUser = object({
  date: eventProps.date,
  entityId: userProps.id.default(() => new ObjectId()),
  userId: eventProps.userId,
  values: object({
    email: userProps.email.required(),
    familyName: userProps.familyName.required(),
    givenName: userProps.givenName.required(),
    verified: userProps.verified.default(false),
  }).required(),
}).required();

/**
 * @typedef DeleteUser
 * @property {ObjectId} entityId
 * @property {Date|string} [date]
 * @property {ObjectId} [userId]
 */
export const deleteUser = object({
  date: eventProps.date,
  entityId: userProps.id.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef RestoreUser
 * @property {Date|string} [date]
 * @property {string} email
 * @property {ObjectId} entityId
 * @property {ObjectId} [userId]
 */
export const restoreUser = object({
  date: eventProps.date,
  email: userProps.email.required(),
  entityId: userProps.id.required(),
  userId: eventProps.userId,
}).required();
