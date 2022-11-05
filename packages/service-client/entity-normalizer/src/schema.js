import { PropTypes } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';

const { array, object } = PropTypes;

/**
 * @typedef NormalizeTypesSchema
 * @property {string[]} entityTypes
 */
export const normalizeTypesSchema = object({
  entityTypes: array().items(
    eventProps.entityType.required(),
  ).required(),
}).required();
