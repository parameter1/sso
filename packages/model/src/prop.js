import { Base } from './base.js';
import {
  attempt,
  schemaObject,
  string,
} from './schema.js';
import { camel } from './utils/inflector.js';

export class Prop extends Base({
  $maybeRequiresValues: ['$name'],
  $name: null,
  $schema: null,
}) {
  name(value) {
    const name = attempt(value, string().required());
    return this.set('$name', camel(name));
  }

  schema(value) {
    this.needsValues('$name');
    const schema = attempt(value, schemaObject().required());
    return this.set('$schema', schema, { schema: schemaObject() });
  }
}

/**
 * Creates a new Prop instance with the prop name and schema type.
 *
 * @param {string} name The property name
 * @param {Joi} schema The property schema object
 * @returns {Prop}
 */
export function prop(name, schema) {
  return (new Prop()).name(name).schema(schema);
}
