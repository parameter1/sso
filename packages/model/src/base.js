/* eslint-disable class-methods-use-this */
import Joi from '@parameter1/joi';
import { isFunction as isFn } from '@parameter1/utils';
import is from '@sindresorhus/is';

const defaultSchema = Joi.string().required();

// @todo account for deep values (and Joi schemas).
const clone = (values) => Object.keys(values).reduce((o, k) => {
  const v = values[k];
  if (is.plainObject(v)) return { ...o, [k]: clone(v) };
  if (is.array(v)) return { ...o, [k]: v.slice() };
  return { ...o, [k]: v };
}, {});

export default class Base {
  constructor() {
    this.values = {};
  }

  $clone() {
    const obj = Object.create(Object.getPrototypeOf(this));
    obj.values = clone(this.values);
    return obj;
  }

  $get(key) {
    const values = this.$values();
    return values[key];
  }

  $set(key, value, schema) {
    const validated = this.$validate(key, value, schema);
    const obj = this.$clone();
    obj.values[key] = validated;
    return obj;
  }

  $validate(key, value, schema = defaultSchema) {
    if (schema != null && !Joi.isSchema(schema)) throw new Error('The provided type must be a Joi schema.');
    if (!schema) return value;

    const { value: validated, error } = schema.label(key).validate(value);

    if (error) throw error;
    return validated;
  }

  $values() {
    const defaults = isFn(this.$defaults) ? this.$defaults() : undefined;
    return clone({ ...defaults, ...this.values });
  }
}
