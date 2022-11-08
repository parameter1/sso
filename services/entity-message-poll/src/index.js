/* eslint-disable no-await-in-loop */
import { immediatelyThrow } from '@parameter1/utils';
import { deleteMessages, pollForMessages } from '@parameter1/sso-sqs';

import { SQS_QUEUE_URL } from './env.js';
import processor from './processor.js';
import sqsClient from './sqs.js';

const { log } = console;
const debug = true;

const run = async () => {
  if (debug) log('Start poll');
  const messages = await pollForMessages({ queueUrl: SQS_QUEUE_URL, sqsClient });
  if (debug) log(`Received ${messages.length} messages`);

  const toDelete = [];
  await Promise.all(messages.map(async ({ Body, ReceiptHandle }) => {
    try {
      await processor.request('processEvent', Body);
      toDelete.push(ReceiptHandle);
      if (debug) log('Successfully processed event', Body);
    } catch (e) {
      // @todo log or move this to lambda
      if (debug) log(`PROCESSING ERROR: ${e.message}`, e);
    }
  }));

  if (toDelete.length) {
    try {
      const res = await deleteMessages({
        receiptHandles: toDelete,
        queueUrl: SQS_QUEUE_URL,
        sqsClient,
      });
      if (res.Failed) {
        const error = new Error('Failed to delete messages');
        error.res = res;
        throw error;
      }
    } catch (e) {
      // @todo log or move this to lambda
      if (debug) log(`MESSAGE DELETE ERROR: ${e.message}`, e);
    }
  }
};

(async () => {
  // @todo determine if this should infinitely loop
  // eslint-disable-next-line
  while (true) {
    await run();
  }
})().catch(immediatelyThrow);
