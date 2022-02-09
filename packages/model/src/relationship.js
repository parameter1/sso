import { Base } from './base.js';
import { has, Has } from './relationship/has.js';
import entityName from './utils/entity-name.js';
import {
  object,
  string,
} from './schema.js';

const hasSchema = object().instance(Has).required();
const typeSchema = string().valid('one', 'many').required();

export class Relationship extends Base({
  $entity: null,
  $has: null,
  $maybeRequiresValues: ['$type', '$entity', '$has'],
  $type: null,
}) {
  /**
   * Sets the entity that _owns_ the relationship. The value will be converted
   * to PascalCase in singular form (e.g. `fruit-snacks` would become
   * `FruitSnack`) - just as the `Entity.name` value is handled.
   *
   * The `type` method must be called before calling the `entity` method,
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
    this.needsValues('$type');
    return this.set('$entity', entityName(value), { strict: true });
  }

  /**
   * Sets the _foreign_ relationship entity as a rel-many. The entity name will
   * be converted to PascalCase in singular form.
   *
   * The `type` and `entity` must be called before calling the `has` method,
   * otherwise an error will be thrown.
   *
   * ```
   * // one-to-many relationships (1:N)
   * rel.type('one').entity('Org').has('many', 'Users');
   * one('Org').has('many', 'Users'); // using rel helper function
   * one('Org').hasMany('Users'); // using `hasMany` helper method
   *
   * // many-to-many relationships (M:N)
   * rel.type('many').entity('Orgs').have('many', 'Users');
   * many('Orgs').have('many', 'Users'); // using rel helper function
   * many('Orgs').haveMany('Users'); // using `haveMany` helper method
   * ```
   *
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  hasMany(value) {
    // @todo create helper func for one and many that isn't called `has`
    this.needsValues('$type', '$entity');
    return this.set('$has', has('many', value), { schema: hasSchema, strict: true });
  }

  /**
   * Sets the _foreign_ relationship entity as a rel-one. The entity name will
   * be converted to PascalCase in singular form.
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
   * // many-to-one relationships (N:1)
   * rel.type('many').entity('Orgs').have('one', 'User');
   * many('Orgs').have('one', 'User'); // using rel helper function
   * many('Orgs').haveOne('User'); // using `haveOne` helper method
   *
   * ```
   *
   * @param {string} value The related entity name.
   * @returns {Relationship}
   */
  hasOne(value) {
    this.needsValues('$type', '$entity');
    return this.set('$has', has('one', value), { schema: hasSchema, strict: true });
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
   * @returns {Relationship}
   */
  type(value) {
    return this.set('$type', value, { schema: typeSchema, strict: true });
  }

  /**
   * Gets the name of the _owning_ entity.
   *
   * @returns {string} The entity name
   */
  getEntityName() {
    this.needsValues('$entity');
    return this.get('$entity');
  }

  /**
   * Gets the _foreign_ relationship type and entity.
   *
   * @returns {Has} The foreign relationship definition
   */
  getHas() {
    this.needsValues('$type', '$entity', '$has');
    return this.get('$has');
  }

  /**
   * Gets the _owning_ relationship type
   *
   * @returns {string} The relationship type - either `one` or `many`
   */
  getType() {
    this.needsValues('$type');
    return this.get('$type');
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
