import { PropTypes } from '@parameter1/sso-prop-types-core';
import { EntityTypes } from '@parameter1/sso-entity-types';

export { getEntityIdPropType } from './get-entity-id-prop-type.js';

const {
  any,
  boolean,
  date,
  object,
  objectId,
  string,
} = PropTypes;

export const eventProps = {
  _id: objectId(),
  command: string().uppercase().pattern(/^[A-Z_]+$/),
  entityId: any().disallow(null, ''),
  entityType: string().valid(...EntityTypes.getKeys()),
  date: date().allow('$$NOW'),
  omitFromHistory: boolean(),
  omitFromModified: boolean(),
  values: object(),
  userId: objectId().allow(null),
};
