import Joi from '@parameter1/joi';
import { isEmailBurner } from '@parameter1/email-utils';

export default {
  id: Joi.objectId(),
  email: Joi.email().lowercase().custom((value) => {
    if (isEmailBurner(value)) throw new Error('The provided email address is not allowed');
    return value;
  }),
  givenName: Joi.string(),
  familyName: Joi.string(),
  verified: Joi.boolean(),
  loginCount: Joi.sequence(),
};
