import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { eventProps } from '@parameter1/sso-prop-types-event';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { SQSClient } from '@parameter1/sso-sqs';

const { object } = PropTypes;

/**
 * @typedef BaseCommandHandlerConstructorParams
 * @property {string} entityType
 * @property {SQSClient} sqsClient
 * @property {EventStore} store
 */
export class BaseCommandHandler {
  /**
   *
   * @param {BaseCommandHandlerConstructorParams} params
   */
  constructor(params) {
    /** @type {BaseCommandHandlerConstructorParams} */
    const { entityType, store, sqsClient } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      sqsClient: object().instance(SQSClient).required(),
      store: object().instance(EventStore).required(),
    }).required());

    /** @type {string} */
    this.entityType = entityType;
    /** @type {SQSClient} */
    this.sqsClient = sqsClient;
    /** @type {EventStore} */
    this.store = store;
  }
}
