import { PropTypes } from '@parameter1/sso-prop-types';

const {
  array,
  objectId,
  string,
  slug,
} = PropTypes;

export default {
  id: objectId(),
  key: slug().min(2),
  name: string().min(2),
  roles: array().items(string().required()),
};
