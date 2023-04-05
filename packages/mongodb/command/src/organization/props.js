import { PropTypes } from '@parameter1/sso-prop-types-core';
import { getEntityIdPropType } from '@parameter1/sso-prop-types-event';

const {
  array,
  hostname,
  slug,
  string,
  url,
} = PropTypes;

const emailDomain = hostname();

export const organizationProps = {
  emailDomain: hostname(),
  emailDomains: array().items(emailDomain),
  id: getEntityIdPropType('organization'),
  key: slug().pattern(/[a-z]/i).min(2),
  name: string().pattern(/[a-z]/i).min(2),
  website: url(),
};
