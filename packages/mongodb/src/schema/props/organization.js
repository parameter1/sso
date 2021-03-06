import { PropTypes } from '@parameter1/prop-types';

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
  managerRole: string().valid('Owner', 'Administrator', 'Manager'),
  name: string().min(2),
};
