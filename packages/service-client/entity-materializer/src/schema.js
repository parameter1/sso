import { attempt, PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';

const { array, object } = PropTypes;

const entityTypes = EntityTypes.getKeys();

/**
 * @typedef NormalizeEntitiesSchema
 * @property {string} entityType The entity type to normalize.
 * @property {*[]} entityIds The entity IDs to normalize.
 */
export const normalizeEntitiesSchema = object({
  entityIds: array().items(eventProps.entityId.required()).required(),
  entityType: eventProps.entityType.required(),
}).required().custom(({ entityIds, entityType }) => ({
  entityIds: attempt(entityIds, getEntityIdPropType(entityType).required()),
  entityType,
}));

/**
 * @typedef NormalizeTypesSchema
 * @property {string[]} entityTypes The types to normalize. If empty, all types are normalized.
 */
export const normalizeTypesSchema = object({
  entityTypes: array().items(
    eventProps.entityType,
  ).default(entityTypes).custom((v) => {
    if (!v.length) return entityTypes;
    return v;
  }),
}).default();
