import { PropTypes } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import applicationProps from './props/application.js';
import organizationProps from './props/organization.js';
import workspaceProps from './props/workspace.js';

const { object } = PropTypes;

export default {
  create: object({
    _edge: object({
      application: object({
        _id: applicationProps.id.required(),
      }).required(),
      organization: object({
        _id: organizationProps.id.required(),
      }).required(),
    }).required(),
    name: workspaceProps.name.required(),
    key: workspaceProps.key.required(),
  }).custom((workspace) => ({
    ...workspace,
    slug: sluggify(workspace.name),
  })).required(),
};
