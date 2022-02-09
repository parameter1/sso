import Joi from '@parameter1/joi';
import { Map, Record, Set } from 'immutable';

// utils
export const { attempt, isSchema } = Joi;

// types
export const alternatives = () => Joi.alternatives();
export const any = () => Joi.any();
export const array = () => Joi.array();
export const immutableMap = () => Joi.object().custom((value) => {
  if (Map.isMap(value)) return value;
  throw new Error('The value must be an immutable map object');
});
export const immutableRecord = () => Joi.object().custom((value) => {
  if (Record.isRecord(value)) return value;
  throw new Error('The value must be an immutable record object');
});
export const immutableSet = () => Joi.object().custom((value) => {
  if (Set.isSet(value)) return value;
  throw new Error('The value must be an immutable set object');
});
export const conditional = (...args) => Joi.alternatives().conditional(...args);
export const object = () => Joi.object();
// export const map = () => Joi.object().instance(Map);
export const schemaObject = () => Joi.object().schema();
// export const set = () => Joi.object().instance(Set);
export const string = () => Joi.string();

export default Joi;
