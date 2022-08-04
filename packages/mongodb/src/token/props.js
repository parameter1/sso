import { PropTypes } from '@parameter1/prop-types';

const {
  number,
  object,
  objectId,
  string,
} = PropTypes;

export default {
  audience: objectId(),
  data: object(),
  id: objectId(),
  issuer: string(),
  subject: string(),
  ttl: number().min(0),
};
