import Joi from '@parameter1/joi';
import { isMap, isSet, isRecord } from 'immutable';

// utils
export const { attempt, isSchema: isPropType } = Joi;
export { default as Joi, validate, validateAsync } from '@parameter1/joi';

export class PropTypes {
  /**
   * Creates an alternatives type.
   *
   * @returns {object}
   */
  static alternatives() {
    return Joi.alternatives();
  }

  /**
   * Creates an any type.
   *
   * @returns {object}
   */
  static any() {
    return Joi.any();
  }

  /**
   * Creates an array type.
   *
   * @returns {object}
   */
  static array() {
    return Joi.array();
  }

  /**
   * Creates a boolean type.
   *
   * @returns {object}
   */
  static boolean() {
    return Joi.boolean();
  }

  /**
   * Creates a conditional type.
   *
   * @param {...any} args
   * @returns {object}
   */
  static conditional(...args) {
    return Joi.alternatives().conditional(...args);
  }

  /**
   * Creates a date type.
   *
   * @returns {object}
   */
  static date() {
    return Joi.date();
  }

  /**
   * Creates an email type.
   *
   * @returns {object}
   */
  static email() {
    return Joi.email();
  }

  /**
   * Creates a hostname type.
   *
   * @returns {object}
   */
  static hostname() {
    return Joi.hostname();
  }

  /**
   * Creates an immutable map type.
   *
   * @returns {object}
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
   * @returns {object}
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
   * @returns {object}
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
   * @returns {object}
   */
  static ip(options) {
    return Joi.string().ip(options);
  }

  /**
   * Creates an IPv4 address type.
   *
   * @returns {object}
   */
  static ipv4() {
    return PropTypes.ip({ version: ['ipv4'], cidr: 'forbidden' });
  }

  /**
   * Creates an integer type.
   *
   * @returns {object}
   */
  static integer() {
    return Joi.integer();
  }

  /**
   * Creates a Map object type.
   *
   * @returns {object}
   */
  static mapObject() {
    return Joi.object().instance(Map);
  }

  /**
   * Creates a number type.
   *
   * @returns {object}
   */
  static number() {
    return Joi.number();
  }

  /**
   * Creates an object type.
   *
   * @returns {object}
   */
  static object() {
    return Joi.object();
  }

  /**
   * Creates a Joi schema object (prop type object)
   *
   * @returns {object}
   */
  static propTypeObject() {
    return Joi.object().schema();
  }

  /**
   * Creates a sequence type.
   *
   * @returns {object}
   */
  static sequence() {
    return Joi.sequence();
  }

  /**
   * Creates a Set object type.
   *
   * @returns {object}
   */
  static setObject() {
    return Joi.object().instance(Set);
  }

  /**
   * Creates a slug type.
   *
   * @returns {object}
   */
  static slug() {
    return Joi.slug();
  }

  /**
   * Creates a string type.
   *
   * @returns {object}
   */
  static string() {
    return Joi.string();
  }

  /**
   * Creates a url type.
   *
   * @returns {object}
   */
  static url() {
    return Joi.url();
  }
}
