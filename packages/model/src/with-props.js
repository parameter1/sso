/* eslint-disable max-classes-per-file */
import { Map as ImmutableMap } from 'immutable';
import { Base } from './base.js';
import { Prop, prop } from './prop.js';
import { Types, attempt } from './types.js';

const { immutableMap, object } = Types;

export const WithProps = (defaults = {}) => class extends Base({
  ...defaults,
  $props: ImmutableMap(),
}) {
  /**
   * A property definition object.
   *
   * @typedef {object} PropDefinition
   * @property {string} name The name of the property
   * @property {Types} schema The schema to use when validating the property
   *                           value
   */

  /**
   * Defines a property on this object, along with its schema. The property name
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
   *   'bar' => { schema: StringType },
   *   'pullRequest' => { schema: StringType },
   *   'baz' => { schema: BooleanType },
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
   *   'bar' => { schema: StringType },
   *   'pullRequest' => { schema: StringType },
   *   'baz' => { schema: BooleanType },
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
   * Gets a single property definition. Will throw an error if the property
   * isn't registered with the instance.
   *
   * @param {string} name The camelCased property name
   * @return {Prop}
   */
  getProp(name) {
    const hasProp = this.hasProp(name);
    if (!hasProp) throw new Error(`No prop was found for \`${name}\``);
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
};

export function withProps(defaults) {
  return new (class extends WithProps(defaults) {})();
}
