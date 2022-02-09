import { WithProps } from './with-props.js';
import { Schema } from './schema.js';
import Inflector from './utils/inflector.js';
import entityName from './utils/entity-name.js';

const { param, plural } = Inflector;

const reqNullableString = Schema.string().required().allow(null);

export class Entity extends WithProps({
  $collection: null,
  $name: null,
}) {
  /**
   * A property definition object.
   *
   * @typedef {object} PropDefinition
   * @property {string} name The name of the property
   * @property {Schema} schema The schema to use when validating the property
   *                           value
   */

  /**
   * Sets the database collection. If this method is _never_ called, then the
   * default collection name will be the param-cased, plural version of the
   * entity name. As an example, if the entity name is `UserEvent` then the
   * collection name would be `user-events`.
   *
   * If the value is `null`, the collection will be reset to it's default value.
   *
   * ```
   * // `some_collection` instead of the default `foos` collection
   * entity('Foo').collection('some_collection');
   * // `foo/bar` instead of the default `foo-bars` collection
   * entity('FooBar').collection('foo/bar');
   * ```
   *
   * @param {string|null} value The collection name
   * @returns {this} The cloned instance
   */
  collection(value) {
    return this.set('$collection', value, { schema: reqNullableString });
  }

  /**
   * Sets the name of the entity. The value will be converted to PascalCase in
   * singular form. As an example, `fruit-snacks` would become `FruitSnack`.
   *
   * This method is called automatically when the `entity` function is invoked.
   *
   * ```
   * entity('Foo');
   * entity('Bars'); // the internal entity name will be `Bar`
   * ```
   *
   * @param {string} value The entity name
   * @returns {this} The cloned instance
   */
  name(value) {
    return this.set('$name', entityName(value, 'name'));
  }

  /**
   * Gets the collection name for this entity.
   *
   * @returns {string|null} The collection name
   */
  getCollection() {
    const name = this.getName();
    const collection = this.get('$collection');
    if (collection) return collection;
    return name ? plural(param(name)) : null;
  }

  /**
   * Gets the name for this entity.
   *
   * @returns {string|null} The entity name
   */
  getName() {
    return this.get('$name');
  }

  /**
   * Gets the plural name of this entity.
   *
   * @returns {string|null}
   */
  getPluralName() {
    const name = this.getName();
    return name ? plural(name) : null;
  }
}

/**
 * Creates a new entity definition.
 *
 * @param {string} name The entity name
 * @returns {Entity} The entity instance
 */
export function entity(name) {
  return (new Entity()).name(name);
}
