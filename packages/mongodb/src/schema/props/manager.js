import { PropTypes } from '@sso/prop-types';

const { string } = PropTypes;

export default {
  role: string().valid('Owner', 'Administrator', 'Manager'),
};
