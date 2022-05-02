import { PropTypes } from '@parameter1/sso-prop-types';
import managerProps from './props/manager.js';
import organizationProps from './props/organization.js';
import userProps from './props/user.js';

const { object } = PropTypes;

export default {
  create: object({
    organization: object({
      _id: organizationProps.id.required(),
    }).required(),
    user: object({
      _id: userProps.id.required(),
    }).required(),
    role: managerProps.role.required(),
  }).required(),
};
