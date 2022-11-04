import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { sluggify } from '@parameter1/slug';

import { CommandHandler } from './-root.js';
import { organizationProps } from '../props/organization.js';

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("../types").ChangeOrganizationNameSchema} ChangeOrganizationNameSchema
 * @typedef {import("../types").CreateOrganizationSchema} CreateOrganizationSchema
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class OrganizationCommandHandler extends CommandHandler {
  /**
   *
   * @param {import("./-root").CommandHandlerConstructorParams} params
   */
  constructor(params) {
    super({ ...params, entityType: 'organization' });
  }

  /**
   * @typedef ChangeOrganizationNameCommandParams
   * @property {ChangeOrganizationNameSchema|ChangeOrganizationNameSchema[]} input
   *
   * @param {ChangeOrganizationNameCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeOrganizationNameCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: organizationProps.id.required(),
        name: organizationProps.name.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('organization.changeName'), params);

    return this.executeUpdate({
      input: input.map(({ name, ...rest }) => ({
        ...rest,
        command: 'CHANGE_NAME',
        values: { name, slug: sluggify(name) },
      })),
    });
  }

  /**
   * @typedef CreateOrganizationCommandParams
   * @property {CreateOrganizationSchema|CreateOrganizationSchema[]} input
   *
   * @param {CreateOrganizationCommandParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateOrganizationCommandParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: organizationProps.id.default(() => this.generateId()),
        userId: eventProps.userId,
        values: object({
          emailDomains: organizationProps.emailDomains.default([]),
          key: organizationProps.key.required(),
          name: organizationProps.name.required(),
        }).required(),
      }).required()).required(),
    }).required().label('organization.create'), params);

    const session = await this.store.mongo.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            key: 'key',
            value: o.values.key,
          })),
          session,
        });

        results = await this.executeCreate({
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
