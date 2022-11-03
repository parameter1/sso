import { PropTypes } from '@parameter1/sso-prop-types-core';

const { objectId } = PropTypes;

const entityIdPropTypes = new Map();

export function getEntityIdPropType(entityType) {
  return entityIdPropTypes.get(entityType) || objectId();
}
