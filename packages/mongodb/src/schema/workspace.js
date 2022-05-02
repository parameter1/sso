import { PropTypes } from '@parameter1/prop-types';
import applicationProps from './props/application.js';
import organizationProps from './props/organization.js';
import workspaceProps from './props/workspace.js';

const { object } = PropTypes;

export default {
  create: object({
    application: object({
      _id: applicationProps.id.required(),
    }).required(),
    organization: object({
      _id: organizationProps.id.required(),
    }).required(),
    name: workspaceProps.name.required(),
    key: workspaceProps.key.required(),
  }).required(),
};
