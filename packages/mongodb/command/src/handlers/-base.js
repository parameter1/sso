import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { eventProps, getEntityIdPropType } from '@parameter1/sso-prop-types-event';
import { EventStore } from '@parameter1/sso-mongodb-event-store';
import { SQSClient, enqueueMessages } from '@parameter1/sso-sqs';

const { object, oneOrMany, url } = PropTypes;

/**
 * @typedef CommandHandlerConstructorParamsSQS
 * @property {SQSClient} client
 * @property {string} url
 *
 * @typedef CommandHandlerConstructorParams
 * @property {string} entityType
 * @property {string} queueUrl
 * @property {CommandHandlerConstructorParamsSQS} sqs
 *
 * @typedef {import("@parameter1/sso-mongodb-event-store").EventStoreDocument} EventStoreDocument
 */
export class BaseCommandHandler {
  /**
   *
   * @param {CommandHandlerConstructorParams} params
   */
  constructor(params) {
    /** @type {CommandHandlerConstructorParams} */
    const { entityType, store, sqs } = attempt(params, object({
      entityType: eventProps.entityType.required(),
      sqs: object({
        client: object().instance(SQSClient).required(),
        url: url().required(),
      }).required(),
      store: object().instance(EventStore).required(),
    }).required());

    /** @type {string} */
    this.entityType = entityType;
    /** @type {CommandHandlerConstructorParamsSQS} */
    this.sqs = sqs;
    /** @type {EventStore} */
    this.store = store;
  }

  /**
   * @typedef CommandHandlerPushToStoreParams
   * @property {EventStoreDocument|EventStoreDocument[]} events
   *
   * @param {CommandHandlerPushToStoreParams} params
   */
  async pushToStore(params) {
    /** @type {CommandHandlerPushToStoreParams} */
    const { events } = await validateAsync(object({
      events: oneOrMany(object({
        command: eventProps.command.required(),
        entityId: getEntityIdPropType(this.entityType).required(),
        date: eventProps.date,
        omitFromHistory: eventProps.omitFromHistory,
        omitFromModified: eventProps.omitFromModified,
        values: eventProps.values,
        userId: eventProps.userId,
      }).required()).required(),
    }).required().label('pushToStore'), params);

    const session = await this.store.mongo.startSession();

    try {
      await session.withTransaction(async (activeSession) => {
        const results = await this.store.push(this.entityType, { events, session: activeSession });
        await enqueueMessages({
          bodies: results,
          queueUrl: this.sqs.url,
          sqsClient: this.sqs.client,
        });
      });
    } finally {
      await session.endSession();
    }
  }
}
