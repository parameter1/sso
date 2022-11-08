import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { ObjectId } from '@parameter1/mongodb-bson';

import { workspaceProps } from './props.js';
import { applicationProps } from '../application/props.js';
import { organizationProps } from '../organization/props.js';

const { object } = PropTypes;

/**
 * @typedef ChangeWorkspaceName
 * @property {Date|string} [date]
 * @property {ObjectId} entityId
 * @property {string} name
 * @property {ObjectId} [userId]
 */
export const changeWorkspaceName = object({
  date: eventProps.date,
  entityId: workspaceProps.id.required(),
  name: workspaceProps.name.required(),
  userId: eventProps.userId,
}).required();

/**
 * @typedef CreateWorkspace
 * @property {Date|string} [date]
 * @property {ObjectId} [entityId]
 * @property {CreateWorkspaceValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateWorkspaceValues
 * @property {ObjectId} appId
 * @property {string} name
 * @property {ObjectId} orgId
 * @property {string} key
 */
export const createWorkspace = object({
  date: eventProps.date,
  entityId: workspaceProps.id.default(() => new ObjectId()),
  userId: eventProps.userId,
  values: object({
    appId: applicationProps.id.required(),
    name: workspaceProps.name.required(),
    orgId: organizationProps.id.required(),
    key: workspaceProps.key.required(),
  }).required(),
}).required();
