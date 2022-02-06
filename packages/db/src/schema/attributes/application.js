import Joi from '@parameter1/joi';

export default {
  id: Joi.objectId(),
  name: Joi.string().min(2),
  slug: Joi.slug().min(2),
};
