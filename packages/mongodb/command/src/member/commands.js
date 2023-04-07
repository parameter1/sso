import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';

import {
  changeMemberRole,
  createMember,
  createOrRestoreMember,
  deleteMember,
  restoreMember,
} from './schema.js';

const { array, boolean, object } = PropTypes;

/**
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class MemberCommands {
  /**
   * @typedef ConstructorParams
   * @property {EventStore} store
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { store } = attempt(params, object({
      store: object().instance(EventStore).required(),
    }).required());
    this.entityType = 'member';
    /** @type {EventStore} */
    this.store = store;
  }

  /**
   * @typedef {import("./schema").ChangeMemberRole} ChangeMemberRole
   *
   * @typedef ChangeRoleParams
   * @property {ChangeMemberRole[]} input
   *
   * @param {ChangeRoleParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeRole(params) {
    /** @type {ChangeRoleParams}  */
    const { input } = await validateAsync(object({
      input: array().items(changeMemberRole).required(),
    }).required().label('member.changeName'), params);

    return this.store.executeUpdate({
      entityType: this.entityType,
      input: input.map(({ role, ...rest }) => ({
        ...rest,
        command: 'CHANGE_ROLE',
        values: { role },
      })),
    });
  }

  /**
   * @typedef {import("./schema").CreateMember} CreateMember
   *
   * @typedef CreateParams
   * @property {CreateMember[]} input
   * @property {boolean} [upsert=false]
   *
   * @param {CreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateParams}  */
    const { input, upsert } = await validateAsync(object({
      input: array().items(createMember).required(),
      upsert: boolean().default(false),
    }).required().label('member.create'), params);

    const { entityType } = this;
    return upsert ? this.store.upsert({
      entityType,
      events: input.map((o) => ({ ...o, upsertOn: ['entityId'] })),
    }) : this.store.executeCreate({
      entityType,
      input,
    });
  }

  /**
   * @typedef {import("./schema").CreateOrRestoreMember} CreateOrRestoreMember
   *
   * @typedef CreateOrRestoreParams
   * @property {CreateOrRestoreMember[]} input
   *
   * @param {CreateOrRestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async createOrRestore(params) {
    /** @type {CreateOrRestoreParams}  */
    const { input } = await validateAsync(object({
      input: array().items(createOrRestoreMember).required(),
    }).required().label('member.createOrRestore'), params);

    try {
      const result = await this.create({ input });
      return result;
    } catch (e) {
      if (e.code !== 11000) throw e;
      return this.restore({ input });
    }
  }

  /**
   * @typedef {import("./schema").DeleteMember} DeleteMember
   *
   * @typedef RestoreParams
   * @property {DeleteMember[]} input
   *
   * @param {RestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async delete(params) {
    /** @type {RestoreParams}  */
    const { input } = await validateAsync(object({
      input: array().items(deleteMember).required(),
    }).required().label('member.delete'), params);

    return this.store.executeDelete({
      entityType: this.entityType,
      input,
    });
  }

  /**
   * @typedef {import("./schema").RestoreMember} RestoreMember
   *
   * @typedef RestoreParams
   * @property {RestoreMember[]} input
   *
   * @param {RestoreParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async restore(params) {
    /** @type {RestoreParams}  */
    const { input } = await validateAsync(object({
      input: array().items(restoreMember).required(),
    }).required().label('member.restore'), params);

    return this.store.executeRestore({
      entityType: this.entityType,
      input,
    });
  }
}
