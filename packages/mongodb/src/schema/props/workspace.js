import { PropTypes } from '@sso/prop-types';
import { cleanPath } from '@parameter1/utils';
import environments from '../environments.js';

const {
  object,
  objectId,
  slug,
  string,
  url,
} = PropTypes;

const appUrl = url().external(cleanPath);

export default {
  id: objectId(),
  key: slug().min(2),
  memberRole: string(),
  name: string().min(2),
  url: appUrl,
  urls: object({
    ...environments.reduce((o, key) => ({ ...o, [key]: appUrl.required() }), {}),
  }),
};
