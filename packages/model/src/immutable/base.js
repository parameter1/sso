/* eslint-disable max-classes-per-file */
import { Record, Set } from 'immutable';
import {
  array,
  object,
  attempt,
  schemaObject,
  string,
} from './schema.js';

const defaultSchema = string().required();

export const Base = (defaults = {}) => {
  const {
    $maybeRequiresMethods = [],
    ...rest
  } = attempt(defaults, object().keys({
    $maybeRequiresMethods: array().items(string()),
  }).unknown().label('defaults'));

  return class extends Record({
    $maybeRequiresMethods: Set($maybeRequiresMethods),
    ...rest,
  }) {
    /**
     * Determines which method values are required to be set on the instance
     * before allowing another method call.
     *
     * @param  {...any} values
     */
    $needs(...values) {
      attempt(values, array().items(string()));
      const required = Set(values);
      this.$maybeRequiresMethods.forEach((key) => {
        if (required.has(key) && this.get(key) == null) {
          throw new Error(`The \`${key}\` value must be set before continuing.`);
        }
      });
      return this;
    }

    /**
     * Validates the provided value against the given schema.
     *
     * @param {string} path The intended key/path
     * @param {*} value The value to validate
     * @param {Joi} schema The schema to use for validation
     * @returns {void}
     */
    $validate(path, value, schema = defaultSchema) { // eslint-disable-line class-methods-use-this
      attempt(schema, schemaObject().allow(null).label('schema'));
      if (!schema) return value;
      const validated = attempt(value, schema.label(path));
      return validated;
    }
  };
};

export function base(defaults) {
  return new (class extends Base(defaults) {})();
}
