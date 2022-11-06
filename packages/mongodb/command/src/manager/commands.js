import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { CommandHandler } from '../handler.js';

import {
  changeManagerRole,
  createManager,
  createOrRestoreManager,
  deleteManager,
  restoreManager,
} from './schema.js';

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
   * @typedef {import("./schema").ChangeManagerRole} ChangeManagerRole
   *
   * @typedef ChangeRoleParams
   * @property {ChangeManagerRole[]} input
   *
   * @param {ChangeRoleParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeRole(params) {
    /** @type {ChangeRoleParams}  */
    const { input } = await validateAsync(object({
      input: array().items(changeManagerRole).required(),
    }).required().label('organization.changeName'), params);

    return this.handler.executeUpdate({
      entityType: this.entityType,
      input: input.map(({ role, ...rest }) => ({
        ...rest,
        command: 'CHANGE_ROLE',
        values: { role },
      })),
    });
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

  /**
   * @typedef {import("./schema").CreateOrRestoreManager} CreateOrRestoreManager
   *
   * @typedef CreateOrRestoreParams
   * @property {CreateOrRestoreManager[]} input
   *
   * @param {CreateOrRestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async createOrRestore(params) {
    /** @type {CreateOrRestoreParams}  */
    const { input } = await validateAsync(object({
      input: array().items(createOrRestoreManager).required(),
    }).required().label('manager.createOrRestore'), params);

    try {
      const result = await this.create({ input });
      return result;
    } catch (e) {
      if (e.code !== 11000) throw e;
      return this.restore({ input });
    }
  }

  /**
   * @typedef {import("./schema").DeleteManager} DeleteManager
   *
   * @typedef RestoreParams
   * @property {DeleteManager[]} input
   *
   * @param {RestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async delete(params) {
    /** @type {RestoreParams}  */
    const { input } = await validateAsync(object({
      input: array().items(deleteManager).required(),
    }).required().label('manager.delete'), params);

    return this.handler.executeDelete({
      entityType: this.entityType,
      input,
    });
  }

  /**
   * @typedef {import("./schema").RestoreManager} RestoreManager
   *
   * @typedef RestoreParams
   * @property {RestoreManager[]} input
   *
   * @param {RestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async restore(params) {
    /** @type {RestoreParams}  */
    const { input } = await validateAsync(object({
      input: array().items(restoreManager).required(),
    }).required().label('manager.restore'), params);

    return this.handler.executeRestore({
      entityType: this.entityType,
      input,
    });
  }
}
