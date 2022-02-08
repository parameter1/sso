import Joi from '@parameter1/joi';
import Base from '../base.js';
import entityName from '../utils/entity-name.js';

const typeSchema = Joi.string().valid('one', 'many').required();

export default class BaseRelationship extends Base {
  as(value) {
    this.$needs('type', 'entity');
    return this.$set('as', value);
  }

  entity(value) {
    this.$needs('type');
    return this.$set('entity', entityName(value));
  }

  hasOne(value) {
    this.$needs('type', 'entity');
    return this.$set('has', entityName(value));
  }

  hasMany(value) {
    this.$needs('type', 'entity');
    return this.$set('has', entityName(value));
  }

  haveOne(value) {
    return this.hasOne(value);
  }

  haveMany(value) {
    return this.hasMany(value);
  }

  type(value) {
    return this.$set('type', value, typeSchema);
  }

  $needs(...values) {
    const set = new Set(values);
    ['type', 'entity'].forEach((key) => {
      if (set.has(key) && this.$get(key) == null) {
        throw new Error(`The relationship \`${key}\` value must be set first.`);
      }
    });
  }
}
