import Joi from '@parameter1/joi';
import { cleanPath } from '@parameter1/utils';
import environments from '../environments.js';

const url = Joi.url().external(cleanPath);

export default {
  id: Joi.objectId(),
  name: Joi.string().min(2),
  namespace: Joi.string(),
  role: Joi.string(),
  slug: Joi.slug().min(2),
  url,
  urls: Joi.object({
    ...environments.reduce((o, key) => ({ ...o, [key]: url.required() }), {}),
  }),
};
