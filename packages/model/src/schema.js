import Joi from '@parameter1/joi';

// types
export const any = () => Joi.any();
export const array = () => Joi.array();
export const string = () => Joi.string();

// utils
export const { attempt, isSchema } = Joi;
