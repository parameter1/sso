import { PropTypes } from '@parameter1/sso-prop-types-core';
import workspaceProps from './workspace.js';
import userProps from './user.js';

const { object, string } = PropTypes;

export default {
  id: object({
    user: userProps.id.required(),
    workspace: workspaceProps.id.required(),
  }).custom(({ user, workspace }) => ({ user, workspace })), // ensure order
  role: string().min(2),
};
