import is from '@sindresorhus/is';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import { WithProps } from './with-props.js';
import { has, Has } from './relationship/has.js';
import entityName from './utils/entity-name.js';
import { PropTypes, attempt } from './prop-types.js';
import Inflector from './utils/inflector.js';

const {
  array,
  conditional,
  immutableMap,
  object,
  string,
} = PropTypes;

const reqNullableString = string().required().allow(null);
const hasSchema = object().instance(Has).required();
const typeSchema = string().valid('one', 'many').required();

export class Relationship extends WithProps({
  $as: null,
  $entity: null,
  $has: null,
  $type: null,
  $with: ImmutableMap({ props: ImmutableSet(), edges: ImmutableSet() }),
}) {
  /**
   * Sets the local field name that will used when saving the relationship. This
   * value will always be converted to camelCase but _won't_ enforce
   * singular/plural form.
   *
   * If this method is _never_ called, the default local field will be set as
   * the camelCased version of the `entity` name. If the relationship `has`
   * value is also set to `many`, then the field will also be converted into
   * plural form.
   *
   * If this method is called with `null` the current `as` value will be unset
   *
   * ```
   * // will set the local field as `myBars` instead of
   * // the default `bars` value.
   * rel.type('one').entity('Foo').hasMany('Bars').as('myBars');
   * one('Foo').hasMany('Bars').as('myBars');
   * ```
   *
   * @param {string|null} value The local field value
   * @returns {this} The cloned instance
   */
  as(value) {
    if (value === null) return this.set('$as', null, { schema: reqNullableString });
    return this.set('$as', Inflector.camel(value));
  }

  /**
   * Sets the entity that _owns_ the relationship. The value will be converted
   * to PascalCase in singular form (e.g. `fruit-snacks` would become
   * `FruitSnack`) - just as the `Entity.name` value is handled.
   *
   * This method is called automatically when the local relationship `one` or
   * `many` helper functions are invoked.
   *
   * ```
   * // in both cases the internal entity name is stored as `Foo`
   * rel.type('one').entity('Foo');
   * rel.type('many').entity('Foos');
   *
   * // using the `one` or `many` functions
   * one('Foo');
   * many('Foos');
   * ```
   *
   * @param {string} value The related entity name
   * @returns {this} The cloned instance
   */
  entity(value) {
    return this.set('$entity', entityName(value), { strict: true });
  }

  /**
   * Sets the _foreign_ relationship entity as a rel-many.
   *
   * @param {string} value The related entity name.
   * @returns {this} The cloned instance
   */
  hasMany(value) {
    return this.setHas('many', value);
  }

  /**
   * Sets the _foreign_ relationship entity as a rel-one.
   *
   * @param {string} value The related entity name.
   * @returns {this} The cloned instance
   */
  hasOne(value) {
    return this.setHas('one', value);
  }

  /**
   * A semantic alias of the `hasMany` method that automatically sets the
   * foreign relationship type to `many`.
   *
   * @param {string} value The related entity name.
   * @returns {this} The cloned instance
   */
  haveMany(value) {
    return this.hasMany(value);
  }

  /**
   * A semantic alias of the `hasOne` method that automatically sets the foreign
   * relationship type to `one`.
   *
   * @param {string} value The related entity name.
   * @returns {this} The cloned instance
   */
  haveOne(value) {
    return this.hasOne(value);
  }

  /**
   * Sets the _foreign_ relationship entity and type. The entity name will be
   * converted to PascalCase in singular form.
   *
   * ```
   * // one-to-one relationships (1:1)
   * rel.type('one').entity('Org').hasHas('one', 'User');
   * one('Org').hasHas('one', 'User'); // using rel helper function
   * one('Org').hasOne('User'); // using `hasOne` helper method
   *
   * // one-to-many relationships (1:N)
   * rel.type('one').entity('Org').hasHas('many', 'Users');
   * one('Org').hasHas('many', 'Users'); // using rel helper function
   * one('Org').hasMany('Users'); // using `hasMany` helper method
   *
   * // many-to-one relationships (N:1)
   * rel.type('many').entity('Orgs').setHas('one', 'User');
   * many('Orgs').setHas('one', 'User'); // using rel helper function
   * many('Orgs').haveOne('User'); // using `haveOne` helper method
   *
   * // many-to-many relationships (M:N)
   * rel.type('many').entity('Orgs').setHas('many', 'Users');
   * many('Orgs').setHas('many', 'Users'); // using rel helper function
   * many('Orgs').haveMany('Users'); // using `haveMany` helper method
   *
   * ```
   *
   * @param {string} type The relationship type - either `one` or `many`
   * @param {string} value The related entity name.
   * @returns {this} The cloned instance
   */
  setHas(type, value) {
    return this.set('$has', has(type, value), { schema: hasSchema, strict: true });
  }

  /**
   * The _local/owning_ relationship type of either `one` or `many`.
   *
   * This method is called automatically when the `one` or `many` helper
   * functions are used.
   *
   * ```
   * (new Relationship()).type('one').entity('Tag');
   * // or...
   * one('Tag');
   *
   * (new Relationship()).type('many').entity('Tags');
   * // or ...
   * many('Tags');
   * ```
   *
   * @param {string} value The owning relationship type - `one` or `many`
   * @returns {this} The cloned instance
   */
  type(value) {
    return this.set('$type', value, { schema: typeSchema, strict: true });
  }

  /**
   * Sets the props and edges that will be saved on the relationship.
   *
   * These values are denormalized and will be automatically updated whenever
   * the values on the foreign document change. These are _not_ properties _on_
   * the relationship (i.e. related fields). To set these, use the `affix`
   * method instead.
   *
   * The value can either be a single string prop, and array of string props, or
   * an object that defines both `props` and `edges`. The method can also be
   * called multiple times to append multiple props and edges.
   *
   * The `_id` value is always saved and will be filtered out if provided.
   *
   * ```
   * // will set the `foo`, `bar`, and `baz` props
   * // and the `a` and `b` edges.
   * rel
   *  .type('one')
   *  .entity('Foo')
   *  .hasMany('Bars')
   *  .with('foo')
   *  .with(['bar'])
   *  .with({ props: ['baz'], edges: ['a', 'b'] });
   *
   * // however, it's easier to do this using a single `with` call:
   * rel.with({ props: ['foo', 'bar', 'baz'], edges: ['a', 'b'] });
   * ```
   *
   * @param {string|string[]|object} value The prop(s) and/or edge(s) to set
   * @returns {this} The cloned instance
   */
  with(value) {
    const v = attempt(value, conditional(array(), {
      then: array().items(string()),
      otherwise: conditional(string(), {
        then: string(),
        otherwise: object().keys({
          props: array(),
          edges: array(),
        }),
      }),
    }).required().label('with'));

    const toSet = { props: [], edges: [] };
    if (is.array(v)) toSet.props.push(...v);
    if (is.string(v)) toSet.props.push(v);
    if (is.plainObject(v) && v.props) toSet.props.push(...v.props);
    if (is.plainObject(v) && v.edges) toSet.edges.push(...v.edges);

    const { union } = ImmutableSet;
    const $with = this.getWith();

    const props = union([$with.get('props'), toSet.props.filter((prop) => prop !== '_id')]);
    const edges = union([$with.get('edges'), toSet.edges.filter((edge) => edge !== '_id')]);

    const map = $with.withMutations((w) => {
      w.set('props', props).set('edges', edges);
    });
    return this.set('$with', map, { schema: immutableMap() });
  }

  /**
   * Gets the local field alias that will used when saving the relationship.
   * Will be `null` if not set or used.
   *
   * @returns {string|null} The local field alias
   */
  getAs() {
    return this.get('$as');
  }

  /**
   * Gets the local field that will be used when saving the relationship. This
   * will use the `as` value, if set, otherwise will return the camelCased
   * version of the foreign entity name (pluralized when the foreign rel type is
   * `many`).
   *
   * @returns {String} The local field name
   */
  getLocalField() {
    const alias = this.getAs();
    if (alias) return alias;
    const rel = this.getHas();
    const field = Inflector.camel(rel.getEntityName());
    return rel.getType() === 'many' ? Inflector.plural(field) : field;
  }

  /**
   * Gets the name of the _owning_ entity.
   *
   * @returns {string} The entity name
   */
  getEntityName() {
    return this.get('$entity');
  }

  /**
   * Gets the _foreign_ relationship type and entity.
   *
   * @returns {Has} The foreign relationship definition
   */
  getHas() {
    return this.get('$has');
  }

  /**
   * Gets the _owning_ relationship type
   *
   * @returns {string} The relationship type - either `one` or `many`
   */
  getType() {
    return this.get('$type');
  }

  /**
   * Gets the denormalized fields that will be saved with the relationship.
   *
   * @returns {ImmutableMap<string, ImmutableSet<string>>}
   */
  getWith() {
    return this.get('$with');
  }

  /**
   * Gets the denormalized edges that will be saved with the relationship.
   *
   * @returns {ImmutableSet<string>}
   */
  getWithEdges() {
    return this.get('$with').get('edges');
  }

  /**
   * Gets the denormalized props that will be saved with the relationship.
   *
   * @returns {ImmutableSet<string>}
   */
  getWithProps() {
    return this.get('$with').get('props');
  }
}

/**
 * Creates an owning relationship instance for `one` related entity.
 *
 * @param {string} name The entity name to relate
 * @returns {this}
 */
export function one(name) {
  return (new Relationship()).type('one').entity(name);
}

/**
 * Creates an owning relationship instance for `many` related entities.
 *
 * @param {string} name The entity name to relate
 * @returns {this}
 */
export function many(name) {
  return (new Relationship()).type('many').entity(name);
}
