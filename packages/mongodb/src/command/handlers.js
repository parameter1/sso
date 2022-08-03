import { PropTypes, attempt } from '@parameter1/prop-types';
import { mongoDBClientProp } from '../props.js';
import { EventStore } from './event-store.js';
import { ReservationsRepo } from './reservations.js';

import { ApplicationCommandHandler } from './handlers/application.js';
import { ManagerCommandHandler } from './handlers/manager.js';
import { OrganizationCommandHandler } from './handlers/organization.js';
import { UserCommandHandler } from './handlers/user.js';

const { object } = PropTypes;

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
      OrganizationCommandHandler,
      UserCommandHandler,
    ].reduce((map, Handler) => {
      const handler = new Handler({ reservations: this.reservations, store: this.store });
      map.set(handler.entityType, handler);
      return map;
    }, new Map());
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
}
