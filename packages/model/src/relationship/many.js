import Relationship from './base.js';

export default function many(entityName) {
  return (new Relationship()).type('many').entity(entityName);
}
