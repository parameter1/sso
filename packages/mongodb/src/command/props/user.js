import { PropTypes } from '@parameter1/prop-types';
import { isEmailBurner } from '@parameter1/email-utils';

const {
  boolean,
  email,
  objectId,
  sequence,
  string,
} = PropTypes;

export default {
  email: email().lowercase().custom((value) => {
    if (isEmailBurner(value)) throw new Error('The provided email address is not allowed');
    return value;
  }),
  familyName: string(),
  id: objectId(),
  loginCount: sequence(),
  givenName: string(),
  slug: string(),
  verified: boolean(),
};
