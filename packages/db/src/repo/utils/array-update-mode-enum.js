import Joi from '@parameter1/joi';

export default Joi.string().valid(...[
  'set',
  'pull',
  'addToSet',
]);
