import { Base } from './base.js';
import { param, plural } from './utils/inflector.js';
import entityName from './utils/entity-name.js';

export class Entity extends Base({
  $collection: null,
  $maybeRequiresValues: ['$name'],
  $name: null,
  $plural: null,
}) {
  /**
   * Sets the database collection. If this method is _never_ called, then the
   * default collection name will be the param-cased, plural version of the
   * entity name. As an example, if the entity name is `UserEvent` then the
   * collection name would be `user-events`.
   *
   * The `name` must be called before calling the `collection` method, otherwise
   * an error will be thrown.
   *
   * ```
   * // `some_collection` instead of the default `foos` collection
   * entity('Foo').collection('some_collection');
   * // `foo/bar` instead of the default `foo-bars` collection
   * entity('FooBar').collection('foo/bar');
   * ```
   *
   * @param {string} value The collection name
   * @returns {this} The cloned instance
   */
  collection(value) {
    this.$needs('$name');
    return this.set('$collection', value);
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
    const name = entityName(value, 'name');
    return this
      .set('$name', name)
      .set('$plural', plural(name))
      .set('$collection', plural(param(name)));
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
