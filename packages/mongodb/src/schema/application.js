import { PropTypes } from '@sso/prop-types';
import props from './props/application.js';

const { object } = PropTypes;

export const createApplicationSchema = object({
  name: props.name.required(),
  key: props.key.required(),
  roles: props.roles.default(['Administrator', 'Member']),
}).required();
