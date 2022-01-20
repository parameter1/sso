import Joi from '@parameter1/joi';

export default {
  id: Joi.objectId(),
  name: Joi.string(),
  slug: Joi.slug(),
};
