import { PropTypes } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import organizationProps from './props/organization.js';

const { object } = PropTypes;

export default {
  create: object({
    name: organizationProps.name.required(),
    key: organizationProps.key.required(),
    emailDomains: organizationProps.emailDomains.default([]),
  }).custom((organization) => ({
    ...organization,
    slug: sluggify(organization.name),
  })).required(),
};
