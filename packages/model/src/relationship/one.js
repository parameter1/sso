import Relationship from './base.js';

export default function one(entityName) {
  return (new Relationship()).type('one').entity(entityName);
}
