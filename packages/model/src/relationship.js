import is from '@sindresorhus/is';
import Base from './base.js';
import entityName from './utils/entity-name.js';
import inflector from './inflector.js';
import {
  array,
  attempt,
  conditional,
  object,
  set,
  string,
} from './schema.js';

const { camel, plural } = inflector;

const setSchema = set();
const typeSchema = string().valid('one', 'many').required();

export class Relationship extends Base {
  /**
   *
   */
  constructor() {
    super({ maybeRequiredMethods: ['type', 'entity', 'has'] });
  }

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
   * The `type`, `entity` and `has` methods must be called before calling
   * the `as` method, otherwise an error will be thrown.
   *
   * ```
   * // will set the local field as `myBars` instead of
   * // the default `bars` value.
   * rel.type('one').entity('Foo').hasMany('Bars').as('myBars');
   * one('Foo').hasMany('Bars').as('myBars');
   * ```
   *
   * @param {string} value The local field value
   * @returns {Relationship}
   */
  as(value) {
    this.$needs('type', 'entity', 'has');
    return this.$set('as', camel(value));
  }

  /**
   * Sets the related entity. The value will be converted to PascalCase in
   * singular form (e.g. `fruit-snacks` would become `FruitSnack`) - just as the
   * `Entity.name` value is handled.
   *
   * The `type`, method must be called before calling the `entity` method,
   * otherwise an error will be thrown.
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
   * @returns {Relationship}
   */
  entity(value) {
    this.$needs('type');
    return this.$set('entity', entityName(value), { strict: true });
  }

  /**
   * Sets the _foreign_ relationship entity and type. The entity name will be
   * converted to PascalCase in singular form.
   *
   * The `type` and `entity` must be called before calling the `has` method,
   * otherwise an error will be thrown.
   *
   * ```
   * // one-to-one relationships (1:1)
   * rel.type('one').entity('Org').has('one', 'User');
   * one('Org').has('one', 'User'); // using rel helper function
   * one('Org').hasOne('User'); // using `hasOne` helper method
   *
   * // one-to-many relationships (1:N)
   * rel.type('one').entity('Org').has('many', 'Users');
   * one('Org').has('many', 'Users'); // using rel helper function
   * one('Org').hasMany('Users'); // using `hasMany` helper method
   *
   * // many-to-one relationships (N:1)
   * rel.type('many').entity('Orgs').have('one', 'User');
   * many('Orgs').have('one', 'User'); // using rel helper function
   * many('Orgs').haveOne('User'); // using `haveOne` helper method
   *
   * // many-to-many relationships (M:N)
   * rel.type('many').entity('Orgs').have('many', 'Users');
   * many('Orgs').have('many', 'Users'); // using rel helper function
   * many('Orgs').haveMany('Users'); // using `haveMany` helper method
   * ```
   *
   * @param {string} type The relationship type, either `one` or `many`
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  has(type, value) {
    this.$needs('type', 'entity');
    return this
      .$set('has.type', type, { schema: typeSchema, strict: true })
      .$set('has.entity', entityName(value), { strict: true });
  }

  /**
   * A semantic alias of the `has` method.
   *
   * @param {string} type The relationship type, either `one` or `many`
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  have(type, value) {
    return this.has(type, value);
  }

  /**
   * A semantic alias of the `has` method that automatically sets the foreign
   * relationship type to `one`.
   *
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  hasOne(value) {
    return this.has('one', value);
  }

  /**
   * A semantic alias of the `has` method that automatically sets the foreign
   * relationship type to `many`.
   *
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  hasMany(value) {
    return this.has('many', value);
  }

  /**
   * A semantic alias of the `has` method that automatically sets the foreign
   * relationship type to `one`.
   *
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  haveOne(value) {
    return this.has('one', value);
  }

  /**
   * A semantic alias of the `has` method that automatically sets the foreign
   * relationship type to `many`.
   *
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  haveMany(value) {
    return this.has('many', value);
  }

  /**
   * The _local/owning_ relationship type of either `one` or `many`.
   *
   * This is called automatically with the `one` or `many` rel helper functions
   * are used.
   *
   * ```
   * one('Tag'); // uses rel.type('one').entity('Tag');
   * many('Tags'); // uses rel.type('many').entity('Tags');
   * ```
   *
   * @param {string} value The owning relationship type - `one` or `many`
   * @returns {Relationship}
   */
  type(value) {
    return this.$set('type', value, { schema: typeSchema, strict: true });
  }

  /**
   * Sets the props and edges that will be saved on the relationship.
   *
   * These values are denormalized and will be automatically updated whenever
   * the values on the foreign document change. These are _not_ properties _on_
   * the relationship (i.e. related fields). To set these, use the `affix`
   * method instead.
   *
   *
   * The value can either be a single string prop, and array of string props, or
   * an object that defines both `props` and `edges`. The method can also be
   * called multiple times to append multiple props and edges.
   *
   * The `type`, `entity` and `has` methods must be called before calling
   * the `with` method, otherwise an error will be thrown.
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
   * @returns {Relationship}
   */
  with(value) {
    this.$needs('type', 'entity', 'has');
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

    const { props, edges } = this.$get('with');
    const toSet = { props: [], edges: [] };
    if (is.array(v)) toSet.props.push(...v);
    if (is.string(v)) toSet.props.push(v);
    if (is.plainObject(v) && v.props) toSet.props.push(...v.props);
    if (is.plainObject(v) && v.edges) toSet.edges.push(...v.edges);

    toSet.props.filter((prop) => prop !== '_id').forEach(props.add.bind(props));
    toSet.edges.filter((edge) => edge !== '_id').forEach(edges.add.bind(edges));

    return this
      .$set('with.props', props, { schema: setSchema })
      .$set('with.edges', edges, { schema: setSchema });
  }

  /**
   * Determines the local field of the relationship.
   *
   * @returns {string}
   */
  $localField() {
    const { as: alias, has } = this.$values();
    if (alias) return alias;
    const field = camel(has.entity);
    return has.type === 'many' ? plural(field) : field;
  }

  // eslint-disable-next-line class-methods-use-this
  $defaults() {
    return {
      affix: {},
      with: { props: new Set(), edges: new Set() },
    };
  }
}

/**
 * Creates an owning relationship instance for `one` related entity.
 *
 * @param {string} name The entity name to relate
 * @returns {Relationship}
 */
export function one(name) {
  return (new Relationship()).type('one').entity(name);
}

/**
 * Creates an owning relationship instance for `many` related entities.
 *
 * @param {string} name The entity name to relate
 * @returns {Relationship}
 */
export function many(name) {
  return (new Relationship()).type('many').entity(name);
}
