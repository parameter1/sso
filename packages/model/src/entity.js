import Base from './base.js';
import inflector from './inflector.js';
import entityName from './utils/entity-name.js';
import { prop } from './property.js';
import {
  array,
  attempt,
  object,
  string,
} from './schema.js';

const { param, plural } = inflector;

export class Entity extends Base {
  /**
   * A Joi schema object for use in validating and sanitizing values
   * @typedef {object} Schema
   * @property {function} required Whether the value must be defined
   */

  /**
   * A property definition object.
   *
   * @typedef {object} PropertyDefinition
   * @property {string} name The name of the property
   * @property {Schema} schema The schema to use when validating the property
   *                           value
   */

  /**
   *
   */
  constructor() {
    super({ maybeRequiredMethods: ['name'] });
    this.$props = new Map();
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
   * The `name` must be called before calling the `collection` method, otherwise
   * an error will be thrown.
   *
   * ```
   * const ent = entity('Foo')
   *  .prop('bar', string())
   *  .prop('pull_request', string())
   *  .prop('baz', boolean());
   *
   * Map(3) {
   *  'bar' => { schema: StringSchema },
   *  'pullRequest' => { schema: StringSchema },
   *  'baz' => { schema: BooleanSchema },
   * } = ent.$get('props');
   * ```
   *
   * Multiple props can be added at once using the `props` method.
   *
   * @param {string} name The name of the property
   * @param {Schema} schema The schema to use when validating the property value
   * @returns {Entity} The cloned instance
   */
  prop(name, schema) {
    this.$needs('name');
    const value = prop(name, schema);
    const obj = this.$clone();
    const key = value.$get('name');
    if (obj.$props.has(key)) throw new Error(`A value already exists for \`props.${key}\``);
    obj.$props.set(key, value);
    return obj;
  }

  /**
   * Definines multiple properties on this entity in one call. Invokes the
   * `prop` method for each value in the array.
   *
   * The `name` must be called before calling the `collection` method, otherwise
   * an error will be thrown.
   *
   * ```
   * const ent = entity('Foo').props([
   *  { name: 'bar', schema: string() },
   *  { name: 'pull_request', schema: string() },
   *  { name: 'baz', schema: boolean() },
   * ]);
   *
   * Map(3) {
   *  'bar' => { schema: StringSchema },
   *  'pullRequest' => { schema: StringSchema },
   *  'baz' => { schema: BooleanSchema },
   * } = ent.$get('props');
   * ```
   * @param {PropertyDefinition[]} values The properties to set
   * @returns {Entity} The cloned instance
   */
  props(values) {
    const props = attempt(values, array().items(
      object({
        name: string().required(),
        schema: object().required(),
      }).required(),
    ).required());

    let instance = this;
    props.forEach(({ name, schema }) => {
      instance = instance.prop(name, schema);
    });
    return instance;
  }

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
   * @returns {Entity} The cloned instance
   */
  collection(value) {
    this.$needs('name');
    return this.$set('collection', value);
  }

  $clone() {
    const cloned = super.$clone();
    cloned.$props = new Map(this.$props);
    return cloned;
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
 * @returns {Entity} The cloned instance
 */
export function entity(name) {
  return (new Entity()).name(name);
}
