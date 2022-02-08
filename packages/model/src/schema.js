import Joi from '@parameter1/joi';

// types
export const alternatives = () => Joi.alternatives();
export const any = () => Joi.any();
export const array = () => Joi.array();
export const conditional = (...args) => Joi.alternatives().conditional(...args);
export const object = () => Joi.object();
export const map = () => Joi.object().instance(Map);
export const set = () => Joi.object().instance(Set);
export const string = () => Joi.string();

// utils
export const { attempt, isSchema } = Joi;

export default Joi;
