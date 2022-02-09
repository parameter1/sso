import { Base } from './base.js';
import { param, plural } from './utils/inflector.js';
import entityName from './utils/entity-name.js';

export class Entity extends Base({
  $collection: null,
  $maybeRequiresMethods: ['name'],
  $name: null,
  $plural: null,
}) {
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
   * @returns {Entity} The cloned instance
   */
  name(value) {
    const name = entityName(value);
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
