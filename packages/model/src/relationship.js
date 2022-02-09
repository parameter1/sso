import { Base } from './base.js';
import { has, Has } from './relationship/has.js';
import entityName from './utils/entity-name.js';
import {
  object,
  string,
} from './schema.js';
import { camel, plural } from './utils/inflector.js';

const hasSchema = object().instance(Has).required();
const typeSchema = string().valid('one', 'many').required();

export class Relationship extends Base({
  $as: null,
  $entity: null,
  $has: null,
  $type: null,
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
   * ```
   * // will set the local field as `myBars` instead of
   * // the default `bars` value.
   * rel.type('one').entity('Foo').hasMany('Bars').as('myBars');
   * one('Foo').hasMany('Bars').as('myBars');
   * ```
   *
   * @param {string} value The local field value
   * @returns {this}
   */
  as(value) {
    return this.set('$as', camel(value));
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
   * @returns {this}
   */
  entity(value) {
    return this.set('$entity', entityName(value), { strict: true });
  }

  /**
   * Sets the _foreign_ relationship entity as a rel-many.
   *
   * @param {string} value The related entity name.
   * @returns {this}
   */
  hasMany(value) {
    return this.setHas('many', value);
  }

  /**
   * Sets the _foreign_ relationship entity as a rel-one.
   *
   * @param {string} value The related entity name.
   * @returns {this}
   */
  hasOne(value) {
    return this.setHas('one', value);
  }

  /**
   * A semantic alias of the `hasMany` method that automatically sets the
   * foreign relationship type to `many`.
   *
   * @param {string} value The related entity name.
   * @returns {this}
   */
  haveMany(value) {
    return this.hasMany(value);
  }

  /**
   * A semantic alias of the `hasOne` method that automatically sets the foreign
   * relationship type to `one`.
   *
   * @param {string} value The related entity name.
   * @returns {this}
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
   * @returns {this}
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
   * @returns {this}
   */
  type(value) {
    return this.set('$type', value, { schema: typeSchema, strict: true });
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
    const field = camel(rel.getEntityName());
    return rel.getType() === 'many' ? plural(field) : field;
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
