import infl from 'inflected';
import { paramCase } from 'param-case';
import { pascalCase } from 'pascal-case';
import { camelCase } from 'camel-case';
import { noCase } from 'no-case';

const clean = (value, fn) => {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? fn(trimmed) : null;
};

export default class Inflector {
  /**
   * Converts a value to `camelCase`
   *
   * @param {string} value The string to convert
   * @returns {string} The converted value
   */
  static camel(value) {
    return clean(value, camelCase);
  }

  /**
   * Converts a value to `no case`
   *
   * @param {string} value The string to convert
   * @returns {string} The converted value
   */
  static none(value) {
    return clean(value, noCase);
  }

  /**
   * Converts a value to `PascalCase`
   *
   * @param {string} value The string to convert
   * @returns {string} The converted value
   */
  static pascal(value) {
    return clean(value, pascalCase);
  }

  /**
   * Converts a value to `param-case`
   *
   * @param {string} value The string to convert
   * @returns {string} The converted value
   */
  static param(value) {
    return clean(value, paramCase);
  }

  /**
   * Converts a value to plural form
   *
   * @param {string} value The string to convert
   * @returns {string} The converted value
   */
  static plural(value) {
    return clean(value, infl.pluralize);
  }

  /**
   * Converts a value to singular form
   *
   * @param {string} value The string to convert
   * @returns {string} The converted value
   */
  static singular(value) {
    return clean(value, infl.singularize);
  }
}
