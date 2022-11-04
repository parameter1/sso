import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { covertActionError } from '@parameter1/sso-micro-ejson';
import { organizationProps } from '@parameter1/sso-mongodb-command';
import { commands } from '../mongodb.js';

const handler = commands.get('organization');

const { object, oneOrMany } = PropTypes;

/**
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .CreateOrganizationSchema} CreateOrganizationSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .ChangeOrganizationNameSchema} ChangeOrganizationNameSchema
 * @typedef {import("@parameter1/sso-mongodb-command")
 *    .EventStoreResult} {EventStoreResult}
 */
export default {
  /**
   * @typedef ChangeOrganizationNameActionParams
   * @property {ChangeOrganizationNameSchema|ChangeOrganizationNameSchema[]} input
   *
   * @param {ChangeOrganizationNameActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeOrganizationNameActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: organizationProps.id.required(),
        name: organizationProps.name.required(),
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('organization.create'), params);

    return covertActionError(() => handler.changeName({ input }));
  },

  /**
   * @typedef CreateOrganizationActionParams
   * @property {CreateOrganizationSchema|CreateOrganizationSchema[]} input
   *
   * @param {CreateOrganizationActionParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateOrganizationActionParams}  */
    const { input } = await validateAsync(object({
      input: oneOrMany(object({
        date: eventProps.date,
        entityId: organizationProps.id,
        userId: eventProps.userId,
        values: object({
          emailDomains: organizationProps.emailDomains.default([]),
          key: organizationProps.key.required(),
          name: organizationProps.name.required(),
        }).required(),
      }).required()).required(),
    }).required().label('organization.create'), params);

    return covertActionError(() => handler.create({ input }));
  },

  /**
   *
   * @param {object} params
   * @param {ObjectId|ObjectId[]} [params.entityIds]
   * @returns {Promise<string>}
   */
  async normalize(params) {
    const { entityIds } = await validateAsync(object({
      entityIds: oneOrMany(organizationProps.id).required(),
    }).required().label('application.create'), params);
    await covertActionError(() => handler.normalize({ entityIds }));
    return 'ok';
  },
};
