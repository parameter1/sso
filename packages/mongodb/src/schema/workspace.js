import { PropTypes } from '@sso/prop-types';
import applicationProps from './props/application.js';
import organizationProps from './props/organization.js';
import workspaceProps from './props/workspace.js';

const { object } = PropTypes;

export default {
  create: object({
    appId: applicationProps.id.required(),
    orgId: organizationProps.id.required(),
    name: workspaceProps.name.required(),
    key: workspaceProps.key.required(),
  }).required(),
};
