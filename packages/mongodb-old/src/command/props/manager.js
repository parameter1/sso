import { PropTypes } from '@parameter1/sso-prop-types-core';
import organizationProps from './organization.js';
import userProps from './user.js';

const { object, string } = PropTypes;

export default {
  id: object({
    org: organizationProps.id.required(),
    user: userProps.id.required(),
  }).custom(({ org, user }) => ({ org, user })), // ensure order
  role: string().valid('Owner', 'Administrator', 'Manager'),
};
