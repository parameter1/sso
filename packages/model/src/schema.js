import Joi from '@parameter1/joi';

// types
export const string = () => Joi.string();
export const array = () => Joi.array();

// utils
export const { attempt, isSchema } = Joi;
