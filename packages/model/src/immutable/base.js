/* eslint-disable max-classes-per-file */
import { Record, Set } from 'immutable';
import {
  array,
  object,
  attempt,
  string,
} from './schema.js';

export const Base = (defaults = {}) => {
  const {
    $maybeRequiresMethods = [],
    ...rest
  } = attempt(defaults, object().keys({
    $maybeRequiresMethods: array().items(string()),
  }).unknown().label('defaults'));

  return class extends Record({
    $maybeRequiresMethods: Set($maybeRequiresMethods),
    ...rest,
  }) {
    /**
     * Determines which method values are required to be set on the instance
     * before allowing another method call.
     *
     * @param  {...any} values
     */
    $needs(...values) {
      attempt(values, array().items(string()));
      const required = Set(values);
      this.$maybeRequiresMethods.forEach((key) => {
        if (required.has(key) && this.get(key) == null) {
          throw new Error(`The \`${key}\` value must be set before continuing.`);
        }
      });
      return this;
    }
  };
};

export function base(defaults) {
  return new (class extends Base(defaults) {})();
}
