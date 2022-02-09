import { Map as ImmutableMap } from 'immutable';
import { Base } from './base.js';
import { prop } from './prop.js';
import { Schema, attempt } from './schema.js';
import Inflector from './utils/inflector.js';
import entityName from './utils/entity-name.js';

const { immutableMap, object } = Schema;
const { param, plural } = Inflector;

export class Entity extends Base({
  $collection: null,
  $name: null,
  $plural: null,
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

  /**
   * Defines a property on this entity, along with its schema. The property name
   * will be converted to camelCase. As an example, `pull_request` would become
   * `pullRequest`.
   *
   * This method will throw an error if an existing property is already set.
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
    const value = prop(name, schema);
    const key = value.get('$name');
    const $props = this.get('$props');
    if ($props.has(key)) throw new Error(`A value already exists for \`props.${key}\``);
    return this.set('$props', $props.set(key, value), { schema: immutableMap() });
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
      if (map.has(key)) throw new Error(`A value already exists for \`props.${key}\``);
      return map.set(key, value);
    }, ImmutableMap());

    const merged = this.get('$props').mergeWith((_, val, key) => {
      if (key) throw new Error(`A value already exists for \`props.${key}\``);
      return val;
    }, props);
    return this.set('$props', merged, { schema: immutableMap() });
  }

  /**
   * Gets the collection name for this entity.
   *
   * @returns {string} The collection name
   */
  getCollection() {
    return this.get('$collection');
  }

  /**
   * Gets the name for this entity.
   *
   * @returns {string} The entity name
   */
  getName() {
    return this.get('$name');
  }

  /**
   * Gets a single property definition. Will throw an error if the property
   * isn't registered with the instance.
   *
   * @param {string} name The camelCased property name
   * @return {Prop}
   */
  getProp(name) {
    const p = this.get('$props').get(name);
    if (!p) throw new Error(`No property named \`${name}\` was found on the \`${this.getName()}\` entity.`);
    return p;
  }

  /**
   * Gets all properties registered with this entity as an immutable map.
   *
   * @returns {ImmutableMap<string, Joi>} The entity name
   */
  getProps() {
    return this.get('$props');
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
