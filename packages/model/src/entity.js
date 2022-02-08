import Base from './base.js';
import inflector from './inflector.js';
import entityName from './utils/entity-name.js';
import {
  attempt,
  isSchema,
  object,
  string,
} from './schema.js';

const { camel, param, plural } = inflector;

class Entity extends Base {
  /**
   * Sets the name of the entity. The value will be automatically
   * converted to PascalCase in singular form (e.g.
   * `fruit-snacks` would become `FruitSnack`).
   *
   * This method is automatically called when the `entity` function is invoked.
   *
   * ```
   * entity('foo');
   * ```
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

  /**
   * Defines a property on this entity, along with its schema. The property
   * name will be automatically converted to camelCase (e.g. `pull_request`
   * would become `pullRequest`).
   *
   * Will throw an error if an existing property is already set.
   *
   * ```
   * entity('foo')
   *  .prop('bar', string())
   *  .prop('baz', boolean());
   * ```
   *
   * @param {string} name The name of the property.
   * @param {object} schema The schema to use when validating the property value
   * @returns {Entity} The cloned instance
   */
  prop(name, schema) {
    const k = attempt(name, string().required());
    if (!isSchema(schema)) throw Error('A Joi schema is required when setting a prop.');
    const path = `props.${camel(k)}`;
    return this.$set(path, { schema }, { schema: object(), strict: true });
  }

  /**
   * Sets the database collection. If never used, the default
   * collection will be the param-cased, plural version of the
   * entity name (e.g. if the entity name is `UserEvent` the collection
   * name will be `user-events`).
   *
   * ```
   * entity('foo').collection('some_collection'); // some_collection
   * entity('bar').collection('foo/bar'); // foo/bar
   * ```
   *
   * @param {string} value The collection name
   * @returns {Entity}
   */
  collection(value) {
    return this.$set('collection', value);
  }

  /**
   * Returns the default values for each instance.
   *
   * @returns {object}
   */
  $defaults() {
    const { name } = this.values;
    return { collection: plural(param(name)) };
  }
}

/**
 * Creates a new entity definition.
 *
 * @param {string} name The entity name.
 * @returns {Entity}
 */
export default function entity(name) {
  return (new Entity()).name(name);
}
