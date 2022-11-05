import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { EntityTypes } from '@parameter1/sso-entity-types';

const { array, object } = PropTypes;

const entityTypes = EntityTypes.getKeys();

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
