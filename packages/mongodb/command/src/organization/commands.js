import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { sluggify } from '@parameter1/slug';
import { CommandHandler } from '../handler.js';

import { changeOrganizationName, createOrganization } from './schema.js';

const { array, object } = PropTypes;

/**
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class OrganizationCommands {
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
    this.entityType = 'organization';
    /** @type {CommandHandler} */
    this.handler = handler;
  }

  /**
   * @typedef {import("./schema").ChangeOrganizationName} ChangeOrganizationName
   *
   * @typedef ChangeNameParams
   * @property {ChangeOrganizationName[]} input
   *
   * @param {ChangeNameParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeNameParams}  */
    const { input } = await validateAsync(object({
      input: array().items(changeOrganizationName).required(),
    }).required().label('organization.changeName'), params);

    return this.handler.executeUpdate({
      entityType: this.entityType,
      input: input.map(({ name, ...rest }) => ({
        ...rest,
        command: 'CHANGE_NAME',
        values: { name, slug: sluggify(name) },
      })),
    });
  }

  /**
   * @typedef {import("./schema").CreateOrganization} CreateOrganization
   *
   * @typedef CreateParams
   * @property {CreateOrganization[]} input
   *
   * @param {CreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateParams}  */
    const { input } = await validateAsync(object({
      input: array().items(createOrganization).required(),
    }).required().label('organization.create'), params);

    const session = this.handler.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.handler.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            entityType: this.entityType,
            key: 'key',
            value: o.values.key,
          })),
          session,
        });

        results = await this.handler.executeCreate({
          entityType: this.entityType,
          input: input.map(({ values, ...rest }) => ({
            ...rest,
            values: { ...values, slug: sluggify(values.name) },
          })),
          session: activeSession,
        });
      });
      return results;
    } finally {
      await session.endSession();
    }
  }
}
