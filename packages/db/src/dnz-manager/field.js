export default class DenormalizedField {
  constructor({ name, schema } = {}) {
    if (!name) throw new Error('The denormalized field name must be provided.');
    if (!schema) throw new Error('No Joi schema was provided for this field.');
    this.name = name;
    this.schema = schema;
  }
}
