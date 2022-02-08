import Joi from '@parameter1/joi';
import inflector from '../inflector.js';

const { pascal, singular } = inflector;

export default (value) => {
  const { value: validted, error } = Joi.string().required().validate(value);
  if (error) throw error;
  return singular(pascal(validted));
};
