import { PropTypes } from '@parameter1/sso-prop-types-core';
import { cleanPath } from '@parameter1/utils';

const {
  objectId,
  slug,
  string,
  url,
} = PropTypes;

const appUrl = url().external(cleanPath);

export default {
  id: objectId(),
  key: slug().min(2),
  name: string().min(2),
  url: appUrl,
};
