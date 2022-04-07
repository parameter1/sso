import { set } from '@parameter1/object-path';
import cleanDocument from '../utils/clean-document.js';

export function buildInsertCriteria(id) {
  if (id) return { _id: id };
  return { _id: { $lt: 0 } };
}

export function buildInsertPipeline(doc, {
  userId,
  ip,
  ua,
  source,
  datePaths = [],
  now = '$$NOW',
} = {}) {
  const obj = {
    ...doc,
    _version: {
      n: 1,
      first: {
        date: now,
        source,
        user: userId ? { _id: userId } : null,
        ip,
        ua,
      },
      last: null,
      history: [],
    },
  };
  datePaths.forEach((path) => set(obj, path, now));

  return [
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            cleanDocument(obj),
            '$$ROOT',
          ],
        },
      },
    },
  ];
}
