import { SQSClient } from '@aws-sdk/client-sqs';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { createMessageBatchCommands } from './create-message-batch-commands.js';
import { sqsMessagesSchema } from './schema.js';

const { object, url } = PropTypes;

/**
 * @typedef {import("./types").SQSMessageSchema} SQSMessageSchema
 *
 * @typedef EnqueueMessagesParams
 * @property {SQSMessageSchema[]} messages
 * @property {string} queueUrl
 * @property {SQSClient} sqsClient
 *
 * @param {EnqueueMessagesParams} params
 * @returns {Promise<Array<object[]>>}
 */
export async function enqueueMessages(params) {
  /** @type {EnqueueMessagesParams} */
  const { messages, queueUrl, sqsClient } = await validateAsync(object({
    messages: sqsMessagesSchema,
    queueUrl: url().required(),
    sqsClient: object().instance(SQSClient).required(),
  }).required(), params);

  const commands = await createMessageBatchCommands({ messages, queueUrl });
  return Promise.all(commands.map(async (command) => {
    const response = await sqsClient.send(command);
    const { Failed } = response;
    if (Failed && Failed.length) {
      const [first] = Failed;
      const error = new Error(`SQS message enqueue encountered ${Failed.length} error(s). First encountered: ${first.Message} (${first.Code})`);
      error.failed = Failed;
      throw error;
    }
    return response;
  }));
}
