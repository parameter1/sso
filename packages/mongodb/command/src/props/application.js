import { PropTypes } from '@parameter1/sso-prop-types-core';
import { getEntityIdPropType } from '@parameter1/sso-prop-types-event';

const { array, string, slug } = PropTypes;

export default {
  id: getEntityIdPropType('application'),
  key: slug().pattern(/[a-z0-9]/i).min(2),
  name: string().pattern(/[a-z0-9]/i).min(2),
  roles: array().items(string().required()),
};
