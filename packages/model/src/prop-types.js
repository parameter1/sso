import Joi from '@parameter1/joi';
import { isMap, isSet, isRecord } from 'immutable';

// utils
export const { attempt, isSchema: isPropType } = Joi;
export { default as Joi, validate, validateAsync } from '@parameter1/joi';

export class PropTypes {
  /**
   * Creates an alternatives type.
   *
   * @returns {function}
   */
  static alternatives() {
    return Joi.alternatives();
  }

  /**
   * Creates an any type.
   *
   * @returns {function}
   */
  static any() {
    return Joi.any();
  }

  /**
   * Creates an array type.
   *
   * @returns {function}
   */
  static array() {
    return Joi.array();
  }

  /**
   * Creates a boolean type.
   *
   * @returns {function}
   */
  static boolean() {
    return Joi.boolean();
  }

  /**
   * Creates a conditional type.
   *
   * @param {...any} args
   * @returns {function}
   */
  static conditional(...args) {
    return Joi.alternatives().conditional(...args);
  }

  /**
   * Creates a date type.
   *
   * @returns {function}
   */
  static date() {
    return Joi.date();
  }

  /**
   * Creates an email type.
   *
   * @returns {function}
   */
  static email() {
    return Joi.email();
  }

  /**
   * Creates a hostname type.
   *
   * @returns {function}
   */
  static hostname() {
    return Joi.hostname();
  }

  /**
   * Creates an immutable map type.
   *
   * @returns {function}
   */
  static immutableMap() {
    return Joi.object().custom((value) => {
      if (isMap(value)) return value;
      throw new Error('The value must be an immutable map object');
    });
  }

  /**
   * Creates an immutable record type.
   *
   * @returns {function}
   */
  static immutableRecord() {
    return Joi.object().custom((value) => {
      if (isRecord(value)) return value;
      throw new Error('The value must be an immutable record object');
    });
  }

  /**
   * Creates an immutable set type.
   *
   * @returns {function}
   */
  static immutableSet() {
    return Joi.object().custom((value) => {
      if (isSet(value)) return value;
      throw new Error('The value must be an immutable set object');
    });
  }

  /**
   * Creates an IP address type.
   *
   * @param {object} options
   * @returns {function}
   */
  static ip(options) {
    return Joi.string().ip(options);
  }

  /**
   * Creates an IPv4 address type.
   *
   * @returns {function}
   */
  static ipv4() {
    return PropTypes.ip({ version: ['ipv4'], cidr: 'forbidden' });
  }

  /**
   * Creates an integer type.
   *
   * @returns {function}
   */
  static integer() {
    return Joi.integer();
  }

  /**
   * Creates a Map object type.
   *
   * @returns {function}
   */
  static mapObject() {
    return Joi.object().instance(Map);
  }

  /**
   * Creates a number type.
   *
   * @returns {function}
   */
  static number() {
    return Joi.number();
  }

  /**
   * Creates an object type.
   *
   * @returns {function}
   */
  static object() {
    return Joi.object();
  }

  /**
   * Creates a Joi schema object type.
   *
   * @returns {function}
   */
  static schemaObject() {
    return Joi.object().schema();
  }

  /**
   * Creates a sequence type.
   *
   * @returns {function}
   */
  static sequence() {
    return Joi.sequence();
  }

  /**
   * Creates a Set object type.
   *
   * @returns {function}
   */
  static setObject() {
    return Joi.object().instance(Set);
  }

  /**
   * Creates a slug type.
   *
   * @returns {function}
   */
  static slug() {
    return Joi.slug();
  }

  /**
   * Creates a string type.
   *
   * @returns {function}
   */
  static string() {
    return Joi.string();
  }

  /**
   * Creates a url type.
   *
   * @returns {function}
   */
  static url() {
    return Joi.url();
  }
}
