import Joi from '@parameter1/joi';
import { isMap, isSet, isRecord } from 'immutable';

// utils
export const { attempt, isSchema } = Joi;
export { default as Joi, validate, validateAsync } from '@parameter1/joi';

export class Schema {
  /**
   * Creates an alternatives type.
   *
   * @returns {Joi}
   */
  static alternatives() {
    return Joi.alternatives();
  }

  /**
   * Creates an any type.
   *
   * @returns {Joi}
   */
  static any() {
    return Joi.any();
  }

  /**
   * Creates an array type.
   *
   * @returns {Joi}
   */
  static array() {
    return Joi.array();
  }

  /**
   * Creates a boolean type.
   *
   * @returns {Joi}
   */
  static boolean() {
    return Joi.boolean();
  }

  /**
   * Creates a conditional type.
   *
   * @param {...any} args
   * @returns {Joi}
   */
  static conditional(...args) {
    return Joi.alternatives().conditional(...args);
  }

  /**
   * Creates a date type.
   *
   * @returns {Joi}
   */
  static date() {
    return Joi.date();
  }

  /**
   * Creates an email type.
   *
   * @returns {Joi}
   */
  static email() {
    return Joi.email();
  }

  /**
   * Creates a hostname type.
   *
   * @returns {Joi}
   */
  static hostname() {
    return Joi.hostname();
  }

  /**
   * Creates an immutable map type.
   *
   * @returns {Joi}
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
   * @returns {Joi}
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
   * @returns {Joi}
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
   * @returns {Joi}
   */
  static ip(options) {
    return Joi.string().ip(options);
  }

  /**
   * Creates an IPv4 address type.
   *
   * @returns {Joi}
   */
  static ipv4() {
    return Schema.ip({ version: ['ipv4'], cidr: 'forbidden' });
  }

  /**
   * Creates an integer type.
   *
   * @returns {Joi}
   */
  static integer() {
    return Joi.integer();
  }

  /**
   * Creates a Map object type.
   *
   * @returns {Joi}
   */
  static mapObject() {
    return Joi.object().instance(Map);
  }

  /**
   * Creates a number type.
   *
   * @returns {Joi}
   */
  static number() {
    return Joi.number();
  }

  /**
   * Creates an object type.
   *
   * @returns {Joi}
   */
  static object() {
    return Joi.object();
  }

  /**
   * Creates a Joi schema object type.
   *
   * @returns {Joi}
   */
  static schemaObject() {
    return Joi.object().schema();
  }

  /**
   * Creates a sequence type.
   *
   * @returns {Joi}
   */
  static sequence() {
    return Joi.sequence();
  }

  /**
   * Creates a Set object type.
   *
   * @returns {Joi}
   */
  static setObject() {
    return Joi.object().instance(Set);
  }

  /**
   * Creates a slug type.
   *
   * @returns {Joi}
   */
  static slug() {
    return Joi.slug();
  }

  /**
   * Creates a string type.
   *
   * @returns {Joi}
   */
  static string() {
    return Joi.string();
  }

  /**
   * Creates a url type.
   *
   * @returns {Joi}
   */
  static url() {
    return Joi.url();
  }
}
