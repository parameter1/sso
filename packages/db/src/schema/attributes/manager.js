import Joi from '@parameter1/joi';

export default {
  id: Joi.objectId(),
  role: Joi.string().valid(...['Owner', 'Administrator']),
};
