import { PropTypes } from '@sso/prop-types';

const {
  array,
  hostname,
  objectId,
  slug,
  string,
} = PropTypes;

const emailDomain = hostname();

export default {
  emailDomain: hostname(),
  emailDomains: array().items(emailDomain),
  id: objectId(),
  key: slug().min(2),
  managerRole: string().valid(...['Owner', 'Administrator']),
  name: string().min(2),
  slug: slug().min(2),
};
