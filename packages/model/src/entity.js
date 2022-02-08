import Base from './base.js';
import inflector from './inflector.js';
import entityName from './utils/entity-name.js';

const { param, plural } = inflector;

class Entity extends Base {
  /**
   * Sets the name of the entity. The value will be automatically
   * converted to PascalCase in singular form (e.g.
   * `fruit-snacks` would become `FruitSnack`).
   *
   * @param {string} value The entity name
   * @returns {Entity} The cloned instance
   */
  name(value) {
    const name = entityName(value);
    return this
      .$set('name', name)
      .$set('plural', plural(name));
  }

  collection(value) {
    return this.$set('collection', value);
  }

  $defaults() {
    const { name } = this.values;
    return { collection: plural(param(name)) };
  }
}

const o = new Entity();

export default function entity(name) {
  return o.name(name);
}
