import Base from './base.js';
import inflector from './inflector.js';

const { param, plural } = inflector;

class Entity extends Base {
  name(value) {
    return this.$set('name', value);
  }

  plural(value) {
    return this.$set('plural', value);
  }

  collection(value) {
    return this.$set('collection', value);
  }

  $defaults() {
    const { name } = this.values;
    return {
      plural: plural(name),
      collection: plural(param(name)),
    };
  }
}

const o = new Entity();

export default function entity(name) {
  return o.name(name);
}
