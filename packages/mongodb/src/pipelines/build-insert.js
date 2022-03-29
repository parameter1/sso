import { set } from '@parameter1/object-path';
import cleanDocument from '../utils/clean-document.js';

export function buildInsertCriteria(id) {
  if (id) return { _id: id };
  return { _id: { $lt: 0 } };
}

export function buildInsertPipeline(doc, {
  datePaths = ['date.created', 'date.updated'],
  now = '$$NOW',
} = {}) {
  const obj = { ...doc };
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
