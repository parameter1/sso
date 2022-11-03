import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { PropTypes, validateAsync } from '@parameter1/sso-prop-types-core';
import { EJSON } from 'bson';
import { chunkArray } from '@parameter1/utils';

const { array, object, url } = PropTypes;

/**
 *
 * @param {object} params
 * @param {object[]} params.bodies
 * @param {string} params.queueUrl
 * @returns {Promise<Array<object[]>>}
 */
export async function createMessageBatchCommands(params) {
  const { bodies, queueUrl } = await validateAsync(object({
    bodies: array().items(object().required()).required(),
    queueUrl: url().required(),
  }).required(), params);

  const chunks = chunkArray(bodies, 10);
  return chunks.map((objs, chunkIndex) => new SendMessageBatchCommand({
    QueueUrl: queueUrl,
    Entries: objs.map((body, objIndex) => ({
      Id: `${chunkIndex}_${objIndex}`,
      MessageBody: EJSON.stringify(body),
    })),
  }));
}
