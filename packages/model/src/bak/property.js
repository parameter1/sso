import Base from './base.js';
import {
  attempt,
  schemaObject,
  string,
} from './schema.js';
import inflector from './inflector.js';

const { camel } = inflector;

export class Property extends Base {
  /**
   *
   */
  constructor() {
    super({ maybeRequiredMethods: ['name', 'schema'] });
  }

  name(value) {
    const name = attempt(value, string().required());
    return this.$set('name', camel(name));
  }

  schema(value) {
    this.$needs('name');
    const schema = attempt(value, schemaObject().required());
    return this.$set('schema', schema, { schema: schemaObject() });
  }
}

/**
 * Creates a new Property instance with the prop name and schema type.
 *
 * @param {string} name The property name
 * @param {Joi} schema The property Schema object
 * @returns {Property}
 */
export function prop(name, schema) {
  return (new Property()).name(name).schema(schema);
}
