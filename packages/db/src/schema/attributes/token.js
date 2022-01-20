import Joi from '@parameter1/joi';

export default {
  audience: Joi.objectId(),
  data: Joi.object(),
  id: Joi.objectId(),
  issuedAt: Joi.date(),
  issuer: Joi.string(),
  subject: Joi.string(),
  ttl: Joi.number().min(0),
};
