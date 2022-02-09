import { Base } from './base.js';
import entityName from './utils/entity-name.js';
import {
  string,
} from './schema.js';

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
