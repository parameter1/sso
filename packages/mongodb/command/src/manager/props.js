import { PropTypes } from '@parameter1/sso-prop-types-core';
import { getEntityIdPropType } from '@parameter1/sso-prop-types-event';

const { string } = PropTypes;

export const managerProps = {
  id: getEntityIdPropType('manager'),
  role: string().valid('Owner', 'Administrator', 'Manager'),
};
