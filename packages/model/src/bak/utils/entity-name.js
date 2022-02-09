import inflector from '../inflector.js';
import { attempt, string } from '../schema.js';

const { pascal, singular } = inflector;

export default (value) => {
  const v = attempt(value, string().required());
  return singular(pascal(v));
};
