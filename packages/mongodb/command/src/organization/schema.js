import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { ObjectId } from '@parameter1/mongodb-bson';

import { organizationProps } from './props.js';

const { object } = PropTypes;

/**
 * @typedef ChangeOrganizationName
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {string} name
 * @property {ObjectId} [userId]
 */
export const changeOrganizationName = object({
  date: eventProps.date,
  entityId: organizationProps.id.required(),
  name: organizationProps.name.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef CreateOrganization
 * @property {Date|string} [date]
 * @property {ObjectId} [entityId]
 * @property {CreateOrganizationValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateOrganizationValues
 * @property {string} name
 * @property {string} key
 * @property {string[]} [emailDomains=[]]
 */
export const createOrganization = object({
  date: eventProps.date,
  entityId: organizationProps.id.default(() => new ObjectId()),
  userId: eventProps.userId,
  values: object({
    emailDomains: organizationProps.emailDomains.default([]),
    key: organizationProps.key.required(),
    name: organizationProps.name.required(),
  }).required(),
}).required();
