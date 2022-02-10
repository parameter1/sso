import { Map as ImmutableMap } from 'immutable';
import { Base } from './base.js';
import { Entity } from './entity.js';
import { PropTypes, attempt } from './prop-types.js';

const { array, immutableMap, object } = PropTypes;

const entityObjectType = object().instance(Entity);

export class Schema extends Base({
  $entities: ImmutableMap(),
}) {
  /**
   *
   * @param {Entity[]} entities The entity definitions
   * @returns {this} The cloned instance
   */
  entities(entities) {
    attempt(entities, array().items(entityObjectType).required());
    const $entities = this.getEntities().withMutations((map) => {
      entities.forEach((entity) => {
        const name = entity.getName();
        if (map.has(name)) throw new Error(`An entity has already be added for \`${name}\``);
        map.set(name, entity);
      });
    });
    return this.set('$entities', $entities, { propType: immutableMap() });
  }

  /**
   *
   * @returns {ImmutableMap<string, Entity>}
   */
  getEntities() {
    return this.get('$entities');
  }
}

export function createSchema() {
  return new Schema();
}
