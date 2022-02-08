import is from '@sindresorhus/is';
import Base from '../base.js';
import entityName from '../utils/entity-name.js';
import inflector from '../inflector.js';
import {
  array,
  attempt,
  conditional,
  object,
  set,
  string,
} from '../schema.js';

const { camel, plural } = inflector;

const setSchema = set();
const typeSchema = string().valid('one', 'many').required();

export default class Relationship extends Base {
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
   * The `type`, `entity` and `has` methods must before called before calling
   * the `as` method, otherwise an error will be thrown.
   *
   * ```
   * // will set the local field as `myBars` instead of
   * // the default `bars` value.
   * rel
   *  .type('one')
   *  .entity('Foo')
   *  .hasMany('Bars')
   *  .as('myBars');
   * ```
   *
   * @param {string} value The local field value
   * @returns {Relationship}
   */
  as(value) {
    this.$needs('type', 'entity', 'has');
    return this.$set('as', camel(value));
  }

  entity(value) {
    this.$needs('type');
    return this.$set('entity', entityName(value), { strict: true });
  }

  has(type, value) {
    this.$needs('type', 'entity');
    return this
      .$set('has.type', type, { schema: typeSchema, strict: true })
      .$set('has.entity', entityName(value), { strict: true });
  }

  hasOne(value) {
    return this.has('one', value);
  }

  hasMany(value) {
    return this.has('many', value);
  }

  haveOne(value) {
    return this.has('one', value);
  }

  haveMany(value) {
    return this.has('many', value);
  }

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
   * The `type`, `entity` and `has` methods must before called before calling
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

  $needs(...values) {
    const s = new Set(values);
    ['type', 'entity', 'has'].forEach((key) => {
      if (s.has(key) && this.$get(key) == null) {
        throw new Error(`The relationship \`${key}\` value must be set first.`);
      }
    });
  }
}
