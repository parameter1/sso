import Joi from '@parameter1/joi';

export default {
  id: Joi.objectId(),
  name: Joi.string(),
  namespace: Joi.string(),
  slug: Joi.slug(),
  url: Joi.url(),
};
