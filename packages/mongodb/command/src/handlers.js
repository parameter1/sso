import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { SQSClient } from '@parameter1/sso-sqs';
import { Reservations } from './reservations.js';

import { ApplicationCommandHandler } from './handlers/application.js';
import { ManagerCommandHandler } from './handlers/manager.js';
import { OrganizationCommandHandler } from './handlers/organization.js';
import { UserCommandHandler } from './handlers/user.js';

const handlers = new Map([
  ['application', ApplicationCommandHandler],
  ['manager', ManagerCommandHandler],
  ['organization', OrganizationCommandHandler],
  ['user', UserCommandHandler],
]);

const { object, url } = PropTypes;

/**
 * @typedef {import("./handlers/-root").CommandHandler} CommandHandler
 *
 * @typedef CommandHandlersConstructorParams
 * @property {Reservations} reservations
 * @property {EventStore} store
 * @property {CommandHandlersConstructorParamsSQS} sqs
 *
 * @typedef CommandHandlersConstructorParamsSQS
 * @property {SQSClient} client
 * @property {string} url
 */
export class CommandHandlers {
  /**
   *
   * @param {CommandHandlersConstructorParams} params
   */
  constructor(params) {
    /** @type {CommandHandlersConstructorParams} */
    const { reservations, store, sqs } = attempt(params, object({
      reservations: object().instance(Reservations).required(),
      sqs: object({
        client: object().instance(SQSClient).required(),
        url: url().required(),
      }).required(),
      store: object().instance(EventStore).required(),
    }).required());

    this.handlers = [...handlers.keys()].reduce((map, entityType) => {
      const CommandHandler = handlers.get(entityType);
      map.set(entityType, new CommandHandler({ reservations, sqs, store }));
      return map;
    }, new Map());
  }

  /**
   *
   * @param {string} entityType
   * @returns {CommandHandler}
   */
  get(entityType) {
    const handler = this.handlers.get(entityType);
    if (!handler) throw new Error(`No command handler exists for type '${entityType}'`);
    return handler;
  }
}
