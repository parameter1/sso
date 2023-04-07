import { EJSON } from '@parameter1/mongodb-bson';
import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { sluggify } from '@parameter1/slug';

import { changeOrganizationName, createOrganization } from './schema.js';

const { array, boolean, object } = PropTypes;

/**
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class OrganizationCommands {
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
    this.entityType = 'organization';
    /** @type {EventStore} */
    this.store = store;
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

    return this.store.executeUpdate({
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
   * @property {boolean} [upsert=false]
   *
   * @param {CreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateParams}  */
    const { input, upsert } = await validateAsync(object({
      input: array().items(createOrganization).required(),
      upsert: boolean().default(false),
    }).required().label('organization.create'), params);

    const { entityType } = this;
    const session = this.store.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        const toPush = input.map(({ values, ...rest }) => ({
          ...rest,
          reserve: [{ key: 'key', value: values.key }],
          values: { ...values, slug: sluggify(values.name), website: values.website || null },
          ...(upsert && { upsertOn: ['values.key'] }),
        }));

        results = upsert
          ? await this.store.upsert({ entityType, events: toPush, session: activeSession })
          : await this.store.executeCreate({ entityType, input: toPush, session: activeSession });

        if (upsert) {
          // when upserting, release any reservations from entities that have since been deleted
          const entityIds = results.map(({ entityId }) => entityId);
          const states = await this.store.getEntityStatesFor({
            entityType,
            entityIds,
            session: activeSession,
          });

          const toRelease = [];
          states.forEach((state, encoded) => {
            const entityId = EJSON.parse(encoded);
            if (state === 'DELETED') toRelease.push({ entityId, entityType, key: 'key' });
          });
          if (toRelease.length) {
            await this.store.release({ input: toRelease, session: activeSession });
          }
        }
      });
      return results;
    } finally {
      await session.endSession();
    }
  }
}
