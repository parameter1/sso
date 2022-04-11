import { PropTypes } from '@sso/prop-types';
import userProps from './props/user.js';
import contextProps from './props/context.js';

const { object } = PropTypes;

export default object({
  userId: userProps.id,
  ip: contextProps.ip.default(null),
  ua: contextProps.ua.default(null),
}).default();