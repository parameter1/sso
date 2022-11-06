import { PropTypes } from '@parameter1/sso-prop-types-core';

const {
  number,
  object,
  objectId,
  string,
} = PropTypes;

export const tokenProps = {
  audience: objectId(),
  data: object(),
  id: objectId(),
  issuer: string(),
  subject: string(),
  ttl: number().min(0),
};
