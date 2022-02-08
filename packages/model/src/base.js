/* eslint-disable class-methods-use-this */
import { isFunction as isFn } from '@parameter1/utils';
import { get, set } from '@parameter1/object-path';
import is from '@sindresorhus/is';
import { attempt, isSchema, string } from './schema.js';

const defaultSchema = string().required();

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

  $get(path) {
    const values = this.$values();
    return get(values, path);
  }

  $has(path) {
    return this.$get(path) != null;
  }

  $set(path, value, { schema, strict = false } = {}) {
    const p = attempt(path, string().label('$set.path').required());
    const validated = this.$validate(path, value, schema);
    if (strict && this.$has(path)) throw new Error(`A value already exists for \`${path}\``);
    const obj = this.$clone();
    set(obj.values, p, validated);
    return obj;
  }

  $validate(path, value, schema = defaultSchema) {
    if (schema != null && !isSchema(schema)) throw new Error('The provided type must be a Joi schema.');
    if (!schema) return value;
    const validated = attempt(value, schema.label(path));
    return validated;
  }

  $values() {
    const defaults = isFn(this.$defaults) ? this.$defaults() : undefined;
    return clone({ ...defaults, ...this.values });
  }
}
