import { micro } from '@parameter1/micro';

export const { createError } = micro;

export { EJSON, ObjectId } from 'bson';
export { covertActionError } from './convert-action-error.js';
export * from './ejson.js';
