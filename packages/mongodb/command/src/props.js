import { PropTypes } from '@parameter1/sso-prop-types-core';

const { any, string } = PropTypes;

export const reservationProps = {
  key: string(),
  value: any().disallow(null, ''),
};
