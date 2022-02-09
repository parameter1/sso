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
     * Sets a value.
     *
     * By default, a required `string()` schema is used to validate the value, but
     * any schema type can used by setting the `schema` option (or set to `null`
     * to bypass validation).
     *
     * To prevent a previously set value from being reassigned, set the `strict`
     * option to true.
     *
     * @param {string} key The keu to set
     * @param {*} value The value to set
     * @param {object} options
     * @param {Joi} options.schema The schema to validate the value against
     * @param {boolean} [options.strict=false] Whether to prevent reassignment of
     *                                         an existing value
     * @returns {this}
     */
    set(key, value, { schema = defaultSchema, strict = false } = {}) {
      const k = attempt(key, string().label('set.key').required());
      const v = this.$validate(k, value, schema);
      if (strict && this.has(k)) throw new Error(`A value already exists for \`${k}\``);
      return super.set(k, v);
    }

    /**
     * Determines which method values are required to be set on the instance
     * before allowing another method call.
     *
     * @param  {...any} values
     * @returns {this}
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

/**
 * Creates an anonymous base record instance.
 *
 * @param {object} defaults The values to set to the instance
 */
export function base(defaults) {
  return new (class extends Base(defaults) {})();
}
