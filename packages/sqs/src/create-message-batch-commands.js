import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { EJSON } from 'bson';
import { chunkArray } from '@parameter1/utils';
import { attributeValueFieldMap, sqsMessagesSchema } from './schema.js';

const { object, url } = PropTypes;

/**
 * @typedef {import("./types").SQSMessageSchema} SQSMessageSchema
 *
 * @typedef CreateMessageBatchCommandParams
 * @property {SQSMessageSchema[]} messages
 * @property {string} queueUrl
 *
 * @param {CreateMessageBatchCommandParams} params
 * @returns {Promise<Array<object[]>>}
 */
export async function createMessageBatchCommands(params) {
  /** @type {CreateMessageBatchCommandParams} */
  const { messages, queueUrl } = await validateAsync(object({
    messages: sqsMessagesSchema,
    queueUrl: url().required(),
  }).required(), params);

  const chunks = chunkArray(messages, 10);
  return chunks.map((objs, chunkIndex) => new SendMessageBatchCommand({
    QueueUrl: queueUrl,
    Entries: objs.map((message, objIndex) => {
      const { attributes } = message;
      return {
        Id: `${chunkIndex}_${objIndex}`,
        MessageBody: EJSON.stringify(message.body),
        ...(attributes.length && {
          MessageAttributes: attributes.reduce((o, { name, type, value }) => {
            const valueField = attributeValueFieldMap.get(type);
            return {
              ...o,
              [name]: { DataType: type, [valueField]: value },
            };
          }, {}),
        }),
      };
    }),
  }));
}
