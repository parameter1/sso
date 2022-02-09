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
  /**
   * Sets the property name.
   *
   * @param {string} value The property name
   * @returns {this}
   */
  name(value) {
    const name = attempt(value, string().required());
    return this.set('$name', camel(name));
  }

  /**
   * Sets the property schema.
   *
   * @param {Joi} value The property schema
   * @returns {this}
   */
  schema(value) {
    this.needsValues('$name');
    const schema = attempt(value, schemaObject().required());
    return this.set('$schema', schema, { schema: schemaObject() });
  }

  /**
   * Gets the property name.
   *
   * The `name` method must be called first otherwise an error will be thrown.
   *
   * @returns {string} The property name
   */
  getName() {
    this.needsValues('$name');
    return this.get('$name');
  }

  /**
   * Gets the property schema.
   *
   * The `name` method must be called first otherwise an error will be thrown.
   *
   * @returns {Joi} The property name
   */
  getSchema() {
    this.needsValues('$name');
    return this.get('$name');
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
