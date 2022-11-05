import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { CommandHandler } from '../handler.js';

import { createManager } from './schema.js';

const { array, object } = PropTypes;

/**
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class ManagerCommands {
  /**
   * @typedef ConstructorParams
   * @property {CommandHandler} handler
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { handler } = attempt(params, object({
      handler: object().instance(CommandHandler).required(),
    }).required());
    this.entityType = 'manager';
    /** @type {CommandHandler} */
    this.handler = handler;
  }

  /**
   * @typedef {import("./schema").CreateManager} CreateManager
   *
   * @typedef CreateParams
   * @property {CreateManager[]} input
   *
   * @param {CreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateParams}  */
    const { input } = await validateAsync(object({
      input: array().items(createManager).required(),
    }).required().label('manager.create'), params);

    return this.handler.executeCreate({
      entityType: this.entityType,
      input,
    });
  }
}
