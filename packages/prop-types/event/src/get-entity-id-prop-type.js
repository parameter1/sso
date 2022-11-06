import { PropTypes } from '@parameter1/sso-prop-types-core';

const { object, objectId } = PropTypes;

const entityIdPropTypes = new Map([
  ['manager', object({
    org: objectId().required(),
    user: objectId().required(),
  }).custom(({ org, user }) => ({ org, user }))],

  ['member', object({
    user: objectId().required(),
    workspace: objectId().required(),
  }).custom(({ user, workspace }) => ({ user, workspace }))],
]);

export function getEntityIdPropType(entityType) {
  return entityIdPropTypes.get(entityType) || objectId();
}
