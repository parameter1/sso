import { SQSClient } from '@aws-sdk/client-sqs';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { createMessageBatchCommands } from './create-message-batch-commands.js';

const { array, object, url } = PropTypes;

/**
 *
 * @param {object} params
 * @param {object[]} params.bodies
 * @param {string} params.queueUrl
 * @param {SQSClient} params.sqsClient
 * @returns {Promise<object[]>}
 */
export async function enqueueMessages(params) {
  const { bodies, queueUrl, sqsClient } = await validateAsync(object({
    bodies: array().items(object().required()).required(),
    queueUrl: url().required(),
    sqsClient: object().instance(SQSClient).required(),
  }).required(), params);

  const commands = await createMessageBatchCommands({ bodies, queueUrl });
  return Promise.all(commands.map((command) => sqsClient.send(command)));
}
