/* eslint-disable max-classes-per-file, class-methods-use-this */
import { Record } from 'immutable';
import { PropTypes, attempt } from './prop-types.js';

const { object, propTypeObject, string } = PropTypes;

const defaultPropType = string().required();

export const Base = (defaults = {}) => {
  const {
    ...rest
  } = attempt(defaults, object().keys().unknown().label('defaults'));

  return class extends Record({
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
     * @param {object} options.propType The prop type to validate the value against
     * @param {boolean} [options.strict=false] Whether to prevent reassignment of
     *                                         an existing value
     * @returns {this}
     */
    set(key, value, { propType = defaultPropType, strict = false } = {}) {
      const k = attempt(key, string().label('set.key').required());
      const v = this.validateValue(k, value, propType);
      if (strict && this.get(k) != null) throw new Error(`A value already exists for \`${k}\``);
      return super.set(k, v);
    }

    /**
     * Validates the provided value against the given schema. Used when setting
     * property values to the instance.
     *
     * @param {string} path The intended key/path
     * @param {*} value The value to validate
     * @param {object} propType The schema to use for validation
     * @returns {*} The validated and resolved value
     */
    validateValue(path, value, schema = defaultPropType) {
      attempt(schema, propTypeObject().allow(null).label('propType'));
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
