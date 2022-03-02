import { PropTypes } from '@sso/prop-types';

const { objectId, string, slug } = PropTypes;

export default {
  id: objectId(),
  key: slug().min(2),
  name: string().min(2),
  slug: slug().min(2),
};
