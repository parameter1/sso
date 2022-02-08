/* eslint-disable class-methods-use-this */
import { isFunction as isFn } from '@parameter1/utils';
import { get, set } from '@parameter1/object-path';
import is from '@sindresorhus/is';
import { attempt, schema as schemaType, string } from './schema.js';

const defaultSchema = string().required();

const clone = (values) => Object.keys(values).reduce((o, k) => {
  const v = values[k];
  if (is.set(v)) return { ...o, [k]: new Set(v) };
  if (is.map(v)) return { ...o, [k]: new Map(v) };
  if (is.object(v) && isFn(v.$clone)) return { ...o, [k]: v.$clone() };
  if (is.plainObject(v)) return { ...o, [k]: clone(v) };
  if (is.array(v)) return { ...o, [k]: v.slice() };
  return { ...o, [k]: v };
}, {});

export default class Base {
  /**
   *
   * @param {object} options Construtor options
   * @param {string[]} options.maybeRequiredMethods Methods that may be required
   *                                                in order to continue with
   *                                                another method
   */
  constructor({ maybeRequiredMethods = [] } = {}) {
    this.values = {};
    this.$maybeRequiredMethods = new Set(maybeRequiredMethods);
  }

  /**
   * Clones the current object and values.
   *
   * @returns {Base} The cloned instance
   */
  $clone() {
    const obj = Object.create(Object.getPrototypeOf(this));
    obj.values = clone(this.values);
    obj.$maybeRequiredMethods = this.$maybeRequiredMethods;
    return obj;
  }

  /**
   * Gets a single value from the instance. Dot-notation can be used to access
   * deep property values.
   *
   * The value is cloned (where applicable).
   *
   * @param {string} path The path to access
   * @returns {*} The path value
   */
  $get(path) {
    const values = this.$values();
    return get(values, path);
  }

  /**
   * Determines if a value exists (i.e. defined and not null). Dot-notation can
   * be used to access deep property values.
   *
   * @param {string} path The path to check
   * @returns {boolean} Whether the path values exists
   */
  $has(path) {
    return this.$get(path) != null;
  }

  /**
   * Determines which method values are required to be set on the instance
   * before allowing another action.
   *
   * @param  {...any} values
   */
  $needs(...values) {
    const required = new Set(values);
    this.$maybeRequiredMethods.forEach((key) => {
      if (required.has(key) && this.$get(key) == null) {
        throw new Error(`The \`${key}\` value must be set before continuing.`);
      }
    });
  }

  /**
   * Sets a value. The values are cloned before setting. Dot-notation can be
   * used to set deep property values.
   *
   * By default, a required `string` schema is used to validate the value, but
   * any schema type can used by setting the `schema` option.
   *
   * To prevent a previously set value from being reassigned, set the `strict`
   * option to true.
   *
   * @param {string} path The path to set
   * @param {*} value The value to set
   * @param {object} options
   * @param {Joi} options.schema The schema to validate the value against
   * @param {boolean} [options.strict=false] Whether to prevent reassignment of
   *                                         an existing value
   * @returns {Base} The cloned instance
   */
  $set(path, value, { schema = defaultSchema, strict = false } = {}) {
    const p = attempt(path, string().label('$set.path').required());
    const validated = this.$validate(p, value, schema);
    if (strict && this.$has(p)) throw new Error(`A value already exists for \`${p}\``);
    const obj = this.$clone();
    set(obj.values, p, validated);
    return obj;
  }

  /**
   * Validates the provided value against the given schema.
   *
   * @param {string} path The intended path
   * @param {*} value The value to validate
   * @param {Joi} schema The schema to use for validation
   * @returns {void}
   */
  $validate(path, value, schema = defaultSchema) {
    attempt(schema, schemaType().allow(null).label('schema'));
    if (!schema) return value;
    const validated = attempt(value, schema.label(path));
    return validated;
  }

  /**
   * Gets all values currently set to the instance.
   * The values are cloned.
   *
   * @returns {object}
   */
  $values() {
    const defaults = isFn(this.$defaults) ? this.$defaults() : undefined;
    return clone({ ...defaults, ...this.values });
  }
}
