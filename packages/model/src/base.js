/* eslint-disable class-methods-use-this */
import Joi from '@parameter1/joi';
import { isFunction as isFn } from '@parameter1/utils';
import is from '@sindresorhus/is';

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

  $set(key, value, { type = 'string', required = true } = {}) {
    const validated = this.$validate(key, value, { type, required });
    const obj = this.$clone();
    obj.values[key] = validated;
    return obj;
  }

  $validate(key, value, { type = 'string', required = true } = {}) {
    if (!Joi[type]) throw new Error(`No validator was found for '${type}'`);
    const mode = required ? 'required' : 'optional';
    const { value: validated, error } = Joi[type]().label(key).presence(mode).validate(value);

    if (error) throw error;
    return validated;
  }

  $values() {
    const defaults = isFn(this.$defaults) ? this.$defaults() : undefined;
    return clone({ ...defaults, ...this.values });
  }
}
