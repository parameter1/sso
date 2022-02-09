import Joi from '@parameter1/joi';
import { isMap, isSet, isRecord } from 'immutable';

// utils
export const { attempt, isSchema } = Joi;

// types
export const alternatives = () => Joi.alternatives();
export const any = () => Joi.any();
export const array = () => Joi.array();
export const boolean = () => Joi.boolean();
export const conditional = (...args) => Joi.alternatives().conditional(...args);
export const date = () => Joi.date();
export const email = () => Joi.email();
export const hostname = () => Joi.hostname();
export const immutableMap = () => Joi.object().custom((value) => {
  if (isMap(value)) return value;
  throw new Error('The value must be an immutable map object');
});
export const immutableRecord = () => Joi.object().custom((value) => {
  if (isRecord(value)) return value;
  throw new Error('The value must be an immutable record object');
});
export const immutableSet = () => Joi.object().custom((value) => {
  if (isSet(value)) return value;
  throw new Error('The value must be an immutable set object');
});
export const ip = (options) => Joi.string().ip(options);
export const ipv4 = () => Joi.string().ip({ version: ['ipv4'], cidr: 'forbidden' });
export const integer = () => Joi.integer();
export const mapObject = () => Joi.object().instance(Map);
export const number = () => Joi.number();
export const object = () => Joi.object();
export const schemaObject = () => Joi.object().schema();
export const sequence = () => Joi.sequence();
export const setObject = () => Joi.object().instance(Set);
export const slug = () => Joi.slug();
export const string = () => Joi.string();
export const url = () => Joi.url();

export default Joi;
