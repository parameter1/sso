import { SQSClient, DeleteMessageBatchCommand } from '@aws-sdk/client-sqs';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';

const {
  array,
  object,
  string,
  url,
} = PropTypes;

/**
 *
 * @param {object} params
 * @param {string} params.queueUrl
 * @param {string[]} params.receiptHandles
 * @param {SQSClient} params.sqsClient
 * @returns {Promise<object[]>}
 */
export async function deleteMessages(params) {
  const { sqsClient, queueUrl, receiptHandles } = await validateAsync(object({
    sqsClient: object().instance(SQSClient).required(),
    queueUrl: url().required(),
    receiptHandles: array().items(string().required()).required(),
  }).required(), params);

  const command = new DeleteMessageBatchCommand({
    Entries: receiptHandles.map((ReceiptHandle, index) => ({ ReceiptHandle, Id: index })),
    QueueUrl: queueUrl,
  });
  return sqsClient.send(command);
}
