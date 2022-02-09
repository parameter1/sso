import { Map as ImmutableMap } from 'immutable';
import { Base } from './base.js';
import { Prop, prop } from './prop.js';
import { Schema, attempt } from './schema.js';
import Inflector from './utils/inflector.js';
import entityName from './utils/entity-name.js';

const { immutableMap, object } = Schema;
const { param, plural } = Inflector;

const reqNullableString = Schema.string().required().allow(null);

export class Entity extends Base({
  $collection: null,
  $name: null,
  $props: ImmutableMap(),
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
   * Defines a property on this entity, along with its schema. The property name
   * will be converted to camelCase. As an example, `pull_request` would become
   * `pullRequest`.
   *
   * Setting a `null` schema will _unset_ the property.
   *
   * This method will throw an error if an existing property is already set (
   * unless the `schema` value is `null`).
   *
   * ```
   * const record = entity('Foo')
   *   .prop('bar', string())
   *   .prop('pull_request', string())
   *   .prop('baz', boolean());
   *
   * ImmutableMap(3) {
   *   'bar' => { schema: StringSchema },
   *   'pullRequest' => { schema: StringSchema },
   *   'baz' => { schema: BooleanSchema },
   * } = record.get('$props');
   * ```
   *
   * Multiple props can be added at once using the `props` method.
   *
   * @param {string} name The name of the property
   * @param {Joi} schema The schema to use when validating the property value
   * @returns {this} The cloned instance
   */
  prop(name, schema) {
    const $props = this.getProps();
    const key = Prop.formatName(name);
    if (schema === null && $props.get(key) != null) {
      // unset the prop
      return this.set('$props', $props.delete(key), { schema: immutableMap() });
    }
    if (this.hasProp(key)) throw new Error(`A prop already exists for \`${key}\``);
    return this.set('$props', $props.set(key, prop(name, schema)), { schema: immutableMap() });
  }

  /**
   * Definines multiple properties on this entity in one call.
   *
   * ```
   * const record = entity('Foo').props({
   *   bar: string(),
   *   pull_request: string(),
   *   baz: boolean(),
   * });
   *
   * ImmutableMap(3) {
   *   'bar' => { schema: StringSchema },
   *   'pullRequest' => { schema: StringSchema },
   *   'baz' => { schema: BooleanSchema },
   * } = record.get('$props');
   * ```
   * @param {PropDefinition[]} values The properties to set
   * @returns {this} The cloned instance
   */
  props(values) {
    const v = attempt(values, object().unknown().required());
    const props = Object.keys(v).reduce((map, name) => {
      const value = prop(name, v[name]);
      const key = value.get('$name');
      if (map.has(key)) throw new Error(`A prop already exists for \`${key}\``);
      return map.set(key, value);
    }, ImmutableMap());

    const merged = this.getProps().mergeWith((_, val, key) => {
      if (key) throw new Error(`A prop already exists for \`${key}\``);
      return val;
    }, props);
    return this.set('$props', merged, { schema: immutableMap() });
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

  /**
   * Gets a single property definition. Will throw an error if the property
   * isn't registered with the instance.
   *
   * @param {string} name The camelCased property name
   * @return {Prop}
   */
  getProp(name) {
    const hasProp = this.hasProp(name);
    if (!hasProp) throw new Error(`No property named \`${name}\` was found on the \`${this.getName()}\` entity.`);
    return this.getProps().get(Prop.formatName(name));
  }

  /**
   * Gets all properties registered with this entity as an immutable map.
   *
   * @returns {ImmutableMap<string, Joi>} The entity name
   */
  getProps() {
    return this.get('$props');
  }

  /**
   * Determines if the property exists on this entity.
   *
   * @param {string} name The camelCased property name
   * @returns {boolean} Whether the property exists
   */
  hasProp(name) {
    const key = Prop.formatName(name);
    return this.getProps().get(key) != null;
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
