import Joi from '@parameter1/joi';
import Base from '../base.js';
import entityName from '../utils/entity-name.js';
import inflector from '../inflector.js';

const { camel, plural } = inflector;

const typeSchema = Joi.string().valid('one', 'many').required();

export default class BaseRelationship extends Base {
  as(value) {
    this.$needs('type', 'entity', 'has');
    return this.$set('as', camel(value));
  }

  entity(value) {
    this.$needs('type');
    return this.$set('entity', entityName(value), { strict: true });
  }

  has(type, value) {
    this.$needs('type', 'entity');
    return this
      .$set('has.type', type, { schema: typeSchema, strict: true })
      .$set('has.entity', entityName(value), { strict: true });
  }

  hasOne(value) {
    return this.has('one', value);
  }

  hasMany(value) {
    return this.has('many', value);
  }

  haveOne(value) {
    return this.has('one', value);
  }

  haveMany(value) {
    return this.has('many', value);
  }

  type(value) {
    return this.$set('type', value, { schema: typeSchema, strict: true });
  }

  $localField() {
    const { as: alias, has } = this.$values();
    if (alias) return alias;
    const field = camel(has.entity);
    return has.type === 'many' ? plural(field) : field;
  }

  // eslint-disable-next-line class-methods-use-this
  $defaults() {
    return {
      affix: {},
      with: { props: [], edges: [], connections: [] },
    };
  }

  $needs(...values) {
    const set = new Set(values);
    ['type', 'entity', 'has'].forEach((key) => {
      if (set.has(key) && this.$get(key) == null) {
        throw new Error(`The relationship \`${key}\` value must be set first.`);
      }
    });
  }
}
