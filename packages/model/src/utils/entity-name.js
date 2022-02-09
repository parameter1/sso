import Inflector from './inflector.js';
import { attempt, string } from '../schema.js';

const { pascal, singular } = Inflector;

/**
 * Formats the name of the entity. The value will be converted to PascalCase in
 * singular form. As an example, `fruit-snacks` would become `FruitSnack`.
 *
 * @param {string} value The value to format
 * @param {string} [key=name] The destination key
 * @return {string} The PascalCased, singularized entity name
 */
export default (value, key = 'name') => {
  const v = attempt(value, string().label(key).required());
  return singular(pascal(v));
};
