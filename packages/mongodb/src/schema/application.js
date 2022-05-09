import { PropTypes } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';

import applicationProps from './props/application.js';

const { object } = PropTypes;

export default {
  create: object({
    name: applicationProps.name.required(),
    key: applicationProps.key.required(),
    roles: applicationProps.roles.default(['Administrator', 'Member']),
  }).custom((application) => ({
    ...application,
    slug: sluggify(application.name),
  })).required(),
};
