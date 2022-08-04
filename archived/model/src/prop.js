import { Base } from './base.js';
import { PropTypes, attempt } from './prop-types.js';
import Inflector from './utils/inflector.js';

const { propTypeObject, string } = PropTypes;

export class Prop extends Base({
  $name: null,
  $type: null,
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
   * Sets the property type.
   *
   * @param {Joi} value The property schema
   * @returns {this}
   */
  type(value) {
    const type = attempt(value, propTypeObject().required());
    return this.set('$type', type, { propType: propTypeObject() });
  }

  /**
   * Gets the property name.
   *
   * @returns {string} The property name
   */
  getName() {
    return this.get('$name');
  }

  /**
   * Gets the property type.
   *
   * @returns {object} The property type
   */
  getType() {
    return this.get('$type');
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
 * @param {object} type The property type
 * @returns {Prop}
 */
export function prop(name, type) {
  return (new Prop()).name(name).type(type);
}
