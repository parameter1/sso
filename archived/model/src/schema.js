import { Map as ImmutableMap } from 'immutable';
import { Base } from './base.js';
import { Entity } from './entity.js';
import { Relationship } from './relationship.js';
import { PropTypes, attempt } from './prop-types.js';

const { array, immutableMap, object } = PropTypes;

const entityObjectType = object().instance(Entity);
const relObjectType = object().instance(Relationship);

export class Schema extends Base({
  $entities: ImmutableMap(),
  $relationships: ImmutableMap(),
}) {
  /**
   *
   * @param {Entity[]} values The entity definitions
   * @returns {this} The cloned instance
   */
  entities(values) {
    attempt(values, array().items(entityObjectType).required());
    const $entities = this.getEntities().withMutations((map) => {
      values.forEach((entity) => {
        const name = entity.getName();
        if (map.has(name)) throw new Error(`An entity has already be added for \`${name}\``);
        map.set(name, entity);
      });
    });
    return this.set('$entities', $entities, { propType: immutableMap() });
  }

  /**
   *
   * @param {Relationship[]} values The relationship definitions
   * @returns {this} The cloned instance
   */
  relationships(values) {
    attempt(values, array().items(relObjectType).required());
    const $relationships = this.getRelationships().withMutations((map) => {
      values.forEach((rel) => {
        const key = rel.getKey();
        if (map.has(key)) throw new Error(`A \`${rel.getHas().getType()}\` relationship using field \`${rel.getLocalField()}\` is already registered for \`${rel.getEntityName()}\``);
        map.set(key, rel);
      });
    });
    return this.set('$relationships', $relationships, { propType: immutableMap() });
  }

  /**
   *
   * @returns {ImmutableMap<string, Entity>}
   */
  getEntities() {
    return this.get('$entities');
  }

  /**
   *
   * @returns {ImmutableMap<string, Relationship>}
   */
  getRelationships() {
    return this.get('$relationships');
  }
}

export function createSchema() {
  return new Schema();
}
