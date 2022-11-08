import { PropTypes } from '@parameter1/sso-prop-types-core';
import { getEntityIdPropType } from '@parameter1/sso-prop-types-event';

const { array, string, slug } = PropTypes;

export const applicationProps = {
  id: getEntityIdPropType('application'),
  key: slug().pattern(/[a-z]/i).min(2),
  name: string().pattern(/[a-z]/i).min(2),
  roles: array().items(string().required()),
};
