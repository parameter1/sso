import { PropTypes } from '@parameter1/sso-prop-types-core';
import { getEntityIdPropType } from '@parameter1/sso-prop-types-event';

const { string } = PropTypes;

export const memberProps = {
  id: getEntityIdPropType('member'),
  role: string().min(2),
};
