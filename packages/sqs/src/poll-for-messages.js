import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { EJSON } from '@parameter1/mongodb-bson';

const {
  array,
  object,
  string,
  url,
} = PropTypes;

/**
 *
 * @param {object} params
 * @param {string[]} [params.messageAttributeNames=[]]
 * @param {string} params.queueUrl
 * @param {SQSClient} params.sqsClient
 * @returns {Promise<object[]>}
 */
export async function pollForMessages(params) {
  const { messageAttributeNames, sqsClient, queueUrl } = await validateAsync(object({
    messageAttributeNames: array().items(string()).default([]),
    sqsClient: object().instance(SQSClient).required(),
    queueUrl: url().required(),
  }).required(), params);

  const command = new ReceiveMessageCommand({
    ...(messageAttributeNames.length && { MessageAttributeNames: messageAttributeNames }),
    MaxNumberOfMessages: 10,
    QueueUrl: queueUrl,
    WaitTimeSeconds: 20,
  });
  const { Messages } = await sqsClient.send(command);
  if (!Messages) return [];
  return Messages.map(({ Body, ...rest }) => ({
    ...rest,
    Body: EJSON.parse(Body),
  }));
}
