import cleanDocument from '../utils/clean-document.js';
import versionDoc from './version-doc.js';

export function buildInsertCriteria(id) {
  if (id) return { _id: id };
  return { _id: { $lt: 0 } };
}

export function buildInsertPipeline(doc, { isVersioned, source, context } = {}) {
  const obj = { ...doc };
  if (isVersioned) {
    const current = versionDoc({ n: 1, source, context });
    obj._version = { initial: current, current, history: [current] };
  }
  return [
    { $replaceRoot: { newRoot: { $mergeObjects: [cleanDocument(obj), '$$ROOT'] } } },
  ];
}
