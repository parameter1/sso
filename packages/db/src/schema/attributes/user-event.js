import Joi from '@parameter1/joi';

const actions = ['accept-org-member-invite', 'magic-login', 'reject-org-member-invite', 'send-login-link', 'logout'];

export default {
  action: Joi.string().valid(...actions),
  date: Joi.date(),
  data: Joi.object(),
  ip: Joi.string().allow('', null),
  ua: Joi.string().allow('', null),
};
