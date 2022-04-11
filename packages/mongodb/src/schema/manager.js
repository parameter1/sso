import { PropTypes } from '@sso/prop-types';
import managerProps from './props/manager.js';
import organizationProps from './props/organization.js';
import userProps from './props/user.js';

const { object } = PropTypes;

export default {
  create: object({
    orgId: organizationProps.id.required(),
    userId: userProps.id.required(),
    role: managerProps.role.required(),
  }).required(),
};
