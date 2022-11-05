import { PropTypes } from '@parameter1/sso-prop-types-core';
import { getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { isEmailBurner } from '@parameter1/email-utils';

const {
  boolean,
  email,
  sequence,
  string,
} = PropTypes;

export const userProps = {
  email: email().lowercase().custom((value) => {
    if (isEmailBurner(value)) throw new Error('The provided email address is not allowed');
    return value;
  }),
  familyName: string(),
  id: getEntityIdPropType('user'),
  loginCount: sequence(),
  givenName: string(),
  slug: string(),
  verified: boolean(),
};
