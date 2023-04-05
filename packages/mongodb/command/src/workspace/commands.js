import { EJSON } from '@parameter1/mongodb-bson';
import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { sluggify } from '@parameter1/slug';

import { changeWorkspaceName, createWorkspace } from './schema.js';

const { array, boolean, object } = PropTypes;

/**
 * @typedef {import("../types").EventStoreResult} EventStoreResult
 */
export class WorkspaceCommands {
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
    this.entityType = 'workspace';
    /** @type {EventStore} */
    this.store = store;
  }

  /**
   * @typedef {import("./schema").ChangeWorkspaceName} ChangeWorkspaceName
   *
   * @typedef ChangeNameParams
   * @property {ChangeWorkspaceName[]} input
   *
   * @param {ChangeNameParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async changeName(params) {
    /** @type {ChangeNameParams}  */
    const { input } = await validateAsync(object({
      input: array().items(changeWorkspaceName).required(),
    }).required().label('workspace.changeName'), params);

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
   * @typedef {import("./schema").CreateWorkspace} CreateWorkspace
   *
   * @typedef CreateParams
   * @property {CreateWorkspace[]} input
   *
   * @param {CreateParams} params
   * @returns {Promise<EventStoreResult[]>}
   */
  async create(params) {
    /** @type {CreateParams}  */
    const { input, upsert } = await validateAsync(object({
      input: array().items(createWorkspace).required(),
      upsert: boolean().default(false),
    }).required().label('workspace.create'), params);

    const { entityType } = this;
    const session = this.store.startSession();
    try {
      let results;
      await session.withTransaction(async (activeSession) => {
        // reserve first, so failed reservations will not trigger a push message
        await this.store.reserve({
          input: input.map((o) => ({
            entityId: o.entityId,
            entityType,
            key: 'app_org_key',
            value: `${o.values.appId}_${o.values.orgId}_${o.values.key}`,
            upsert,
          })),
          session: activeSession,
        });

        const toPush = input.map(({ values, ...rest }) => ({
          ...rest,
          values: { ...values, slug: sluggify(values.name) },
          ...(upsert && { upsertOn: ['appId', 'orgId', 'key'] }),
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
            if (state === 'DELETED') toRelease.push({ entityId, entityType, key: 'app_org_key' });
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
