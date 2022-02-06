import Joi from '@parameter1/joi';

export default class DenormalizedField {
  constructor({ name, schema } = {}) {
    if (typeof name !== 'string') throw new Error('The field name must be a string.');
    const n = name.trim();
    if (!n) throw new Error('The field name must be provided.');
    if (!Joi.isSchema(schema)) throw new Error('No Joi schema was provided for this field.');
    if (n === '_id') throw new Error('You cannot define/manipulate the denormalized _id field.');
    this.name = n;
    this.schema = schema;
  }
}
