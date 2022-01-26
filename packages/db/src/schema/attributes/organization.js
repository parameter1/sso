import Joi from '@parameter1/joi';

const emailDomain = Joi.hostname();

export default {
  id: Joi.objectId(),
  name: Joi.string(),
  slug: Joi.slug(),
  managerRole: Joi.string().valid(...['Owner', 'Administrator']),
  emailDomain: Joi.hostname(),
  emailDomains: Joi.array().items(emailDomain),
};
