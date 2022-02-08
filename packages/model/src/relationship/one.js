import BaseRelationship from './base.js';

class RelOne extends BaseRelationship {

}

const o = new RelOne();

export default function one(entityName) {
  return o.type('one').entity(entityName);
}
