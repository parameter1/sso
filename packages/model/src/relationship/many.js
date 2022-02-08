import BaseRelationship from './base.js';

class RelMany extends BaseRelationship {}

const o = new RelMany();

export default function many(entityName) {
  return o.type('many').entity(entityName);
}
