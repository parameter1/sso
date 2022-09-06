import { DB_NAME } from '@parameter1/sso-mongodb';
import { mongodb } from './mongodb.js';

export async function getResumeCollection() {
  return mongodb.collection({
    dbName: DB_NAME,
    name: 'event-store/change-stream-tokens',
  });
}

export async function findResumeToken() {
  const collection = await getResumeCollection();
  return collection.findOne({}, { sort: { _id: -1 } });
}

export async function createChangeStream({ token } = {}) {
  const eventStoreColl = await mongodb.collection({ dbName: DB_NAME, name: 'event-store' });
  return eventStoreColl.watch([
    {
      $match: {
        operationType: 'insert',
      },
    },
  ], { ...(token && { resumeAfter: token._id }) });
}

export async function upsertChangeResult({ _id, event }) {
  const collection = await getResumeCollection();
  return collection.updateOne({ _id }, [{
    $set: { _id, date: '$$NOW', event },
  }], { upsert: true });
}
