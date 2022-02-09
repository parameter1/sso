import { Base } from '../base.js';
import entityName from '../utils/entity-name.js';
import { string } from '../schema.js';

const typeSchema = string().valid('one', 'many').required();

export class Has extends Base({
  $entity: null,
  $type: null,
}) {
  /**
   * Sets the _foreign_ entity name. The value will be converted to PascalCase
   * in singular form.
   *
   * @param {string} value The foreign entity name
   * @returns {Has}
   */
  entity(value) {
    return this.set('$entity', entityName(value), { strict: true });
  }

  /**
   * The _foreign_ relationship type of either `one` or `many`.
   *
   * @param {string} value The relationship type - `one` or `many`
   * @returns {Has}
   */
  type(value) {
    return this.set('$type', value, { schema: typeSchema, strict: true });
  }

  /**
   *
   * @returns {string} The foreign entity name
   */
  getEntityName() {
    return this.get('$entity');
  }

  /**
   *
   * @returns {string} The foreign rel type - `one` or `many`
   */
  getType() {
    return this.get('$type');
  }
}

/**
 * @param {string} type The foreign relationship type - either `one` or `many`
 * @param {string} value The foreign entity name.
 * @returns {Has}
 */
export function has(type, entity) {
  return (new Has()).type(type).entity(entity);
}
