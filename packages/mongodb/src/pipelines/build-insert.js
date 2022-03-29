import { set } from '@parameter1/object-path';
import cleanDocument from '../utils/clean-document.js';

export function buildInsertCriteria(id) {
  if (id) return { _id: id };
  return { _id: { $lt: 0 } };
}

export function buildInsertPipeline(doc, {
  createdDatePath = 'date.created',
  updatedDatePath = 'date.updated',
  now = '$$NOW',
} = {}) {
  const obj = { ...doc };
  set(obj, createdDatePath, now);
  set(obj, updatedDatePath, now);

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
