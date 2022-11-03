import { PropTypes } from '@parameter1/sso-prop-types-core';

const { any, string } = PropTypes;

export default {
  key: string(),
  value: any().disallow(null, ''),
};
