import { PropTypes, attempt } from '@parameter1/prop-types';
import { mongoDBClientProp } from '../props.js';
import { EventStore, eventProps } from './event-store.js';
import { ReservationsRepo } from './reservations.js';
import { NormalizedBuilders } from '../normalized/builders.js';

import { ApplicationCommandHandler } from './handlers/application.js';
import { ManagerCommandHandler } from './handlers/manager.js';
import { MemberCommandHandler } from './handlers/member.js';
import { OrganizationCommandHandler } from './handlers/organization.js';
import { UserCommandHandler } from './handlers/user.js';
import { WorkspaceCommandHandler } from './handlers/workspace.js';

const { boolean, object, oneOrMany } = PropTypes;

export class CommandHandlers {
  /**
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor(params) {
    const { client } = attempt(params, object({
      client: mongoDBClientProp.required(),
    }).required());

    this.store = new EventStore({ client });
    this.reservations = new ReservationsRepo({ client });
    this.handlers = [
      ApplicationCommandHandler,
      ManagerCommandHandler,
      MemberCommandHandler,
      OrganizationCommandHandler,
      UserCommandHandler,
      WorkspaceCommandHandler,
    ].reduce((map, Handler) => {
      const handler = new Handler({ reservations: this.reservations, store: this.store });
      map.set(handler.entityType, handler);
      return map;
    }, new Map());

    this.normalizedBuilders = new NormalizedBuilders();
  }

  createIndexes() {
    return Promise.all([
      this.store.createIndexes(),
      this.reservations.createIndexes(),
    ]);
  }

  /**
   * Gets a command handler for the provided entity type.
   *
   * @param {string} entityType
   * @returns {BaseCommandHandler}
   */
  get(entityType) {
    const handler = this.handlers.get(entityType);
    if (!handler) throw new Error(`No command handler exists for entity type '${entityType}'`);
    return handler;
  }

  keys() {
    return [...this.handlers.keys()];
  }

  /**
   * Normalizes data from the event store collection based on the provided entity type and IDs
   *
   * @param {object} params
   * @param {string} params.entityType
   * @param {*|*[]} [params.entityIds=[]]
   * @param {boolean} [params.withMergeStage=true]
   */
  async normalize(params) {
    const { entityType, entityIds, withMergeStage } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      entityIds: oneOrMany(eventProps.entityId).required(),
      withMergeStage: boolean().default(true),
    }).required());

    const builder = this.normalizedBuilders.get(entityType);
    const pipeline = builder.buildPipeline({ entityIds, withMergeStage });
    const cursor = await this.store.aggregate({ pipeline });
    return cursor.toArray();
  }

  normalizerKeys() {
    return this.normalizedBuilders.keys();
  }
}
