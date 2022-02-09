import { Base } from './base.js';
import { Schema, attempt } from './schema.js';
import Inflector from './utils/inflector.js';

const { schemaObject, string } = Schema;

export class Prop extends Base({
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
    return this.set('$name', Prop.formatName(value));
  }

  /**
   * Sets the property schema.
   *
   * @param {Joi} value The property schema
   * @returns {this}
   */
  schema(value) {
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
    return this.get('$schema');
  }

  /**
   * Formats the property name.
   *
   * @param {string} value The prop name to format
   * @returns {string} The formatted value
   */
  static formatName(value) {
    const name = attempt(value, string().required());
    return Inflector.camel(name);
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
