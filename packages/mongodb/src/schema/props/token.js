import { PropTypes } from '@sso/prop-types';

const {
  date,
  number,
  object,
  objectId,
  string,
} = PropTypes;

export default {
  audience: objectId(),
  data: object(),
  id: objectId(),
  issuedAt: date(),
  issuer: string(),
  subject: string(),
  ttl: number().min(0),
};
