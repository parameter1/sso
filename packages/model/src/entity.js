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
      .$set('name', name)
      .$set('plural', plural(name));
  }

  /**
   * Defines a property on this entity, along with its schema. The property name
   * will be converted to camelCase. As an example, `pull_request` would become
   * `pullRequest`.
   *
   * This method will throw an error if an existing property is already set.
   *
   * ```
   * entity('Foo')
   *  .prop('bar', string())
   *  .prop('pull_request', string()) // stored internally as `pullRequest`
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
   * Sets the database collection. If this method is _never_ called, then the
   * default collection name will be the param-cased, plural version of the
   * entity name. As an example, if the entity name is `UserEvent` then the
   * collection name would be `user-events`.
   *
   * ```
   * // `some_collection` instead of the default `foos` collection
   * entity('Foo').collection('some_collection');
   * // `foo/bar` instead of the default `foo-bars` collection
   * entity('FooBar').collection('foo/bar');
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
