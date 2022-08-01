import { PropTypes } from '@parameter1/prop-types';

const {
  array,
  string,
  slug,
} = PropTypes;

export default {
  key: slug().min(2),
  name: string().min(2),
  roles: array().items(string().required()),
};
